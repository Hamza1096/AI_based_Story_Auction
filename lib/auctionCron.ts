import connectToDatabase from "@/lib/mongodb";
import Proposal from "@/models/Proposal";
import Bid from "@/models/Bid";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Story from "@/models/Story";
import { syncEpisodesForStory } from "@/lib/episodeCompiler";
import { AUCTION_CONFIG } from "@/lib/auctionConfig";

interface CloseExpiredAuctionsOptions {
  force?: boolean;
  storyId?: string;
}

/**
 * Closes eligible pending auctions at midnight (PKT cutoff).
 * For manual testing, `force: true` can close currently pending proposals immediately.
 * The winner is the proposal with the highest totalBidAmount.
 * Tie-breaker: earliest createdAt wins (AS-19).
 */
export async function closeExpiredAuctions(options: CloseExpiredAuctionsOptions = {}) {
  const { force = false, storyId: targetStoryId } = options;

  try {
    await connectToDatabase();

    // Calculate the start of the current day in Pakistan Time (PKT, UTC+5)
    // We add a 2-minute (120,000 ms) forward tolerance buffer. If the cron or an API call 
    // executes at 23:58:00 to 23:59:59 PKT, it safely evaluates as the "next day" 
    // guaranteeing today's proposals confidently close without 1-second server race conditions.
    const now = new Date();
    
    // Convert to PKT (+5 hours) and push forward by the 2 minute race-tolerance buffer.
    const pktTime = new Date(now.getTime() + 120000 + 5 * 60 * 60 * 1000);
    
    // We bind the generated cutoff strictly to 00:00:00 PKT for that logical calculated day.
    // Shift back 5 hours to store as UTC for MongoDB comparison.
    const startOfTodayPKTInUTC = new Date(
      Date.UTC(pktTime.getUTCFullYear(), pktTime.getUTCMonth(), pktTime.getUTCDate(), 0, 0, 0) - 5 * 60 * 60 * 1000
    );

    const pendingQuery: {
      status: "pending";
      storyId?: string;
      createdAt?: { $lt: Date };
    } = {
      status: "pending",
    };

    if (targetStoryId) {
      pendingQuery.storyId = targetStoryId;
    }

    if (!force) {
      pendingQuery.createdAt = { $lt: startOfTodayPKTInUTC };
    }

    // Find all pending proposals eligible for this run
    const expiredProposals = await Proposal.find(pendingQuery)
      .select("storyId")
      .lean();

    if (expiredProposals.length === 0) {
      if (force) {
        console.log("[AuctionCron] No pending auctions found for manual close.");
      } else {
        console.log("[AuctionCron] No expired auctions found.");
      }
      return;
    }

    // Get unique story IDs that have expired auctions
    const storyIdsToClose = [
      ...new Set(
        expiredProposals.map((p) => String((p as { storyId: unknown }).storyId))
      ),
    ];

    let closedCount = 0;

    for (const storyId of storyIdsToClose) {
      const storyPendingQuery: {
        storyId: string;
        status: "pending";
        createdAt?: { $lt: Date };
      } = {
        storyId,
        status: "pending",
      };

      if (!force) {
        storyPendingQuery.createdAt = { $lt: startOfTodayPKTInUTC };
      }

      // Fetch all pending proposals for this story eligible for this run
      const proposals = await Proposal.find(storyPendingQuery);

      if (proposals.length > 0) {
        // Calculate total bids across all proposals for this story
        const totalBidsForStory = proposals.reduce((sum, p) => sum + (p.totalBidAmount || 0), 0);

        // Sort proposals based on rules:
        // If there are ANY bids for the story, sort ONLY by totalBidAmount (descending), tie breaker createdAt.
        // If NO bids exist for the story at all, sort by voteCount (descending), tie breaker createdAt.
        proposals.sort((a, b) => {
          if (totalBidsForStory > 0) {
            if ((b.totalBidAmount || 0) !== (a.totalBidAmount || 0)) {
              return (b.totalBidAmount || 0) - (a.totalBidAmount || 0);
            }
          } else {
            if ((b.voteCount || 0) !== (a.voteCount || 0)) {
              return (b.voteCount || 0) - (a.voteCount || 0);
            }
          }
          // Tie-breaker: earliest createdAt wins (ascending)
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        // ── Mark winner ───────────────────────────────────────────────────
        const winnerProposal = proposals[0];
        await Proposal.findByIdAndUpdate(winnerProposal._id, { $set: { status: "winner" } });

        // ── Validate winner config ────────────────────────────────────────
        const winnerTotal =
          AUCTION_CONFIG.WINNER_PLATFORM_FEE_PCT + AUCTION_CONFIG.WINNER_AUTHOR_SHARE_PCT;
        if (winnerTotal > 100) {
          console.error(
            `[AuctionCron] WINNER config invalid: fee(${AUCTION_CONFIG.WINNER_PLATFORM_FEE_PCT}) + author(${AUCTION_CONFIG.WINNER_AUTHOR_SHARE_PCT}) > 100. Skipping winner settlement.`
          );
        } else {
          // ── Case 1: Settle winning proposal bids ─────────────────────────
          // Platform fee % is already gone from bidder wallets (deducted at bid time).
          // We only need to credit the author share to the proposal author.
          const winningBids = await Bid.find({ proposalId: winnerProposal._id });
          for (const bid of winningBids) {
            const authorCredit = parseFloat(
              ((bid.amount * AUCTION_CONFIG.WINNER_AUTHOR_SHARE_PCT) / 100).toFixed(2)
            );

            if (authorCredit > 0) {
              // Credit the proposal author
              await User.findByIdAndUpdate(winnerProposal.userId, {
                $inc: { walletBalance: authorCredit },
              });

              await Transaction.create({
                userId: winnerProposal.userId,
                type: "credit",
                amount: authorCredit,
                status: "completed",
                description: `Author share (${AUCTION_CONFIG.WINNER_AUTHOR_SHARE_PCT}%) from winning bid on proposal ${winnerProposal._id}`,
              });
            }
          }
        }

        // ── Validate loser config ─────────────────────────────────────────
        const loserTotal =
          AUCTION_CONFIG.LOSER_PLATFORM_FEE_PCT + AUCTION_CONFIG.LOSER_AUTHOR_SHARE_PCT;
        if (loserTotal > 100) {
          console.error(
            `[AuctionCron] LOSER config invalid: fee(${AUCTION_CONFIG.LOSER_PLATFORM_FEE_PCT}) + author(${AUCTION_CONFIG.LOSER_AUTHOR_SHARE_PCT}) > 100. Falling back to full refund.`
          );
        }

        // ── Case 2: Settle losing proposal bids ──────────────────────────
        for (let i = 1; i < proposals.length; i++) {
          const loserProposal = proposals[i];
          await Proposal.findByIdAndUpdate(loserProposal._id, { $set: { status: "loser" } });

          const losingBids = await Bid.find({ proposalId: loserProposal._id });

          for (const bid of losingBids) {
            if (loserTotal > 100) {
              // Config is invalid — fall back to full refund so no bidder loses money unfairly
              await User.findByIdAndUpdate(bid.userId, {
                $inc: { walletBalance: bid.amount },
              });
              await Transaction.create({
                userId: bid.userId,
                type: "credit",
                amount: bid.amount,
                status: "completed",
                description: `Full refund (config error) for losing proposal ${loserProposal._id}`,
              });
              continue;
            }

            const platformFee = parseFloat(
              ((bid.amount * AUCTION_CONFIG.LOSER_PLATFORM_FEE_PCT) / 100).toFixed(2)
            );
            const authorCredit = parseFloat(
              ((bid.amount * AUCTION_CONFIG.LOSER_AUTHOR_SHARE_PCT) / 100).toFixed(2)
            );
            const refundAmount = parseFloat(
              (bid.amount - platformFee - authorCredit).toFixed(2)
            );

            // Credit the proposal author their share
            if (authorCredit > 0) {
              await User.findByIdAndUpdate(loserProposal.userId, {
                $inc: { walletBalance: authorCredit },
              });
              await Transaction.create({
                userId: loserProposal.userId,
                type: "credit",
                amount: authorCredit,
                status: "completed",
                description: `Author share (${AUCTION_CONFIG.LOSER_AUTHOR_SHARE_PCT}%) from losing bid on proposal ${loserProposal._id}`,
              });
            }

            // Refund the remainder to the bidder
            if (refundAmount > 0) {
              await User.findByIdAndUpdate(bid.userId, {
                $inc: { walletBalance: refundAmount },
              });
              await Transaction.create({
                userId: bid.userId,
                type: "credit",
                amount: refundAmount,
                status: "completed",
                description: `Partial refund (${100 - AUCTION_CONFIG.LOSER_PLATFORM_FEE_PCT - AUCTION_CONFIG.LOSER_AUTHOR_SHARE_PCT}%) for losing proposal ${loserProposal._id}`,
              });
            }

            console.log(
              `[AuctionCron] Loser bid £${bid.amount}: platform £${platformFee} | author £${authorCredit} | refund £${refundAmount}`
            );
          }
        }

        closedCount++;
        console.log(
          `[AuctionCron] Closed auction for story ${storyId}. Winner: proposal ${proposals[0]._id} (£${proposals[0].totalBidAmount} total bids)`
        );
      }
    }

    console.log(`[AuctionCron] Done. Closed ${closedCount} auction(s).`);

    // Sync episodes for all active stories to cover gaps
    const activeStories = await Story.find({ status: "active" }).select("_id").lean();
    for (const story of activeStories) {
      await syncEpisodesForStory(story._id.toString());
    }

  } catch (error) {
    console.error("[AuctionCron] Error closing auctions:", error);
  }
}
