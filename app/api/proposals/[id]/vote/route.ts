import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Proposal from "@/models/Proposal";
import Vote from "@/models/Vote";

/**
 * POST /api/proposals/[id]/vote
 * Place or switch a vote for a proposal.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to vote." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Proposal ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    if (proposal.status !== "pending") {
      return NextResponse.json({ error: "You can only vote on pending proposals." }, { status: 400 });
    }

    const userId = session.user.id;
    const storyId = proposal.storyId.toString();

    // Check if the user already voted for ANY proposal in this story
    const existingVote = await Vote.findOne({ userId, storyId });

    if (existingVote) {
      // If they already voted for this exactly proposal, maybe do nothing or return a message
      if (existingVote.proposalId.toString() === id) {
        return NextResponse.json({ message: "You have already voted for this proposal." }, { status: 200 });
      }

      // If they voted for a different proposal, we switch their vote!
      const oldProposalId = existingVote.proposalId;
      
      existingVote.proposalId = id; // update to new proposal
      await existingVote.save();

      // Decrement old
      await Proposal.findByIdAndUpdate(oldProposalId, { $inc: { voteCount: -1 } });
      // Increment new
      await Proposal.findByIdAndUpdate(id, { $inc: { voteCount: 1 } });

      return NextResponse.json({ message: "Vote successfully changed!" }, { status: 200 });
    }

    // No existing vote, create new one
    await Vote.create({ userId, storyId, proposalId: id });
    await Proposal.findByIdAndUpdate(id, { $inc: { voteCount: 1 } });

    return NextResponse.json({ message: "Vote cast successfully!" }, { status: 201 });
  } catch (error) {
    console.error(`[POST /api/proposals/[id]/vote]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
