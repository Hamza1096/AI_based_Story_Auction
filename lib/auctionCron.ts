import connectToDatabase from "@/lib/mongodb";
import Proposal from "@/models/Proposal";
import Bid from "@/models/Bid";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Story from "@/models/Story";
import { syncEpisodesForStory } from "@/lib/episodeCompiler";

/**
 * Closes all pending auctions at midnight.
 * As per requirements, this closes all pending proposals no matter the time created.
 * The winner is the proposal with the highest totalBidAmount.
 * Tie-breaker: earliest createdAt wins (AS-19).
 */
export async function closeExpiredAuctions() {
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

    // Find all pending proposals created before the start of the current day in PKT
    const expiredProposals = await Proposal.find({
      status: "pending",
      createdAt: { $lt: startOfTodayPKTInUTC }
    })
      .select("storyId")
      .lean();

    if (expiredProposals.length === 0) {
      console.log("[AuctionCron] No expired auctions found.");
      return;
    }

    // Get unique story IDs that have expired auctions
    const storyIdsToClose = [
      ...new Set(expiredProposals.map((p: any) => p.storyId.toString())),
    ];

    let closedCount = 0;

    for (const storyId of storyIdsToClose) {
      // Fetch all pending proposals for this story that were created before today in PKT
      const proposals = await Proposal.find({
        storyId,
        status: "pending",
        createdAt: { $lt: startOfTodayPKTInUTC }
      });

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

        // Atomically mark winner — $set avoids any risk of overwriting other fields via .save()
        await Proposal.findByIdAndUpdate(proposals[0]._id, { $set: { status: "winner" } });

        // Mark all other proposals as losers and refund their bids
        for (let i = 1; i < proposals.length; i++) {
          const loserProposalId = proposals[i]._id;
          await Proposal.findByIdAndUpdate(loserProposalId, { $set: { status: "loser" } });

          // Refund bids for this losing proposal
          const losingBids = await Bid.find({ proposalId: loserProposalId });
          for (const bid of losingBids) {
            // Refund the user wallet
            await User.findByIdAndUpdate(bid.userId, {
              $inc: { walletBalance: bid.amount },
            });

            // Create a transaction record for the refund
            await Transaction.create({
              userId: bid.userId,
              type: "credit",
              amount: bid.amount,
              status: "completed",
              description: `Refund for unaccepted proposal (ID: ${loserProposalId})`,
            });
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
