import connectToDatabase from "@/lib/mongodb";
import Proposal from "@/models/Proposal";

/**
 * Closes all auctions whose proposals are older than 24 hours.
 * The winner is the proposal with the highest totalBidAmount.
 * Tie-breaker: earliest createdAt wins (AS-19).
 */
export async function closeExpiredAuctions() {
  try {
    await connectToDatabase();

    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - TWENTY_FOUR_HOURS);

    // Find all pending proposals that are older than 24 hours
    const expiredProposals = await Proposal.find({
      status: "pending",
      createdAt: { $lte: cutoffDate },
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

        // Mark all other proposals as losers
        for (let i = 1; i < proposals.length; i++) {
          await Proposal.findByIdAndUpdate(proposals[i]._id, { $set: { status: "loser" } });
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
