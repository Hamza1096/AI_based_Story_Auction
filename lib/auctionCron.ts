import connectToDatabase from "@/lib/mongodb";
import Proposal from "@/models/Proposal";
import Bid from "@/models/Bid";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

/**
 * Closes all pending auctions at midnight.
 * As per requirements, this closes all pending proposals no matter the time created.
 * The winner is the proposal with the highest totalBidAmount.
 * Tie-breaker: earliest createdAt wins (AS-19).
 */
export async function closeExpiredAuctions() {
  try {
    await connectToDatabase();

    // Find all pending proposals no matter the time created
    const expiredProposals = await Proposal.find({
      status: "pending"
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
      // Fetch all pending proposals for this story, sorted by highest bid then earliest submission
      const proposals = await Proposal.find({
        storyId,
        status: "pending",
      }).sort({ totalBidAmount: -1, createdAt: 1 }); // AS-19 Tie-breaker

      if (proposals.length > 0) {
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
  } catch (error) {
    console.error("[AuctionCron] Error closing auctions:", error);
  }
}
