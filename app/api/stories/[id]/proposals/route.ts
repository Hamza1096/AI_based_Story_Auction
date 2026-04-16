import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Proposal from "@/models/Proposal";
import Story from "@/models/Story";
import Bid from "@/models/Bid";
import Vote from "@/models/Vote";

/**
 * POST /api/stories/[id]/proposals
 * Create a new proposal for a story.
 *
 * Acceptance criteria:
 *  - User must be logged in ✓
 *  - Proposal must be linked to a story ✓
 *  - One proposal per user per story per day ✓
 *  - Proposal must be within defined character limit (500) ✓
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to submit a proposal." }, { status: 401 });
    }

    const p = await params;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ error: "Story ID is required." }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Proposal content is required." }, { status: 400 });
    }

    const trimmedContent = content.trim();

    // Check character limit (AS-13)
    const MAX_LENGTH = 500;
    if (trimmedContent.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `Proposal exceeds the maximum length of ${MAX_LENGTH} characters.` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify story exists
    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }

    // Check against blacklist
    if (story.blacklist && story.blacklist.length > 0) {
      const lowerContent = trimmedContent.toLowerCase();
      const blockedWords = story.blacklist.filter((word: string) => lowerContent.includes(word));
      
      if (blockedWords.length > 0) {
        return NextResponse.json(
          { error: `Proposal contains forbidden keywords. Please remove them and try again.` },
          { status: 400 }
        );
      }
    }

    // Check one proposal per user per story per day (AS-12)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentProposal = await Proposal.findOne({
      storyId: id,
      userId: session.user.id,
      createdAt: { $gte: oneDayAgo },
    });

    if (recentProposal) {
      return NextResponse.json(
        { error: "You have already submitted a proposal for this story recently. Please wait 24 hours between submissions." },
        { status: 429 } // Too Many Requests
      );
    }

    // Save proposal
    const proposal = await Proposal.create({
      storyId: id,
      userId: session.user.id,
      userName: session.user.name || "Anonymous",
      content: trimmedContent,
      status: "pending",
    });

    // Optionally: we can increment the participant count of the story here if needed, 
    // but the SRS mentions just that the user submits a proposal.
    // We could do an upsert or check if user has ever proposed before.
    // For now, we just update participant count if this is their very first proposal maybe?
    // We can run a quick check:
    const userPreviousProposals = await Proposal.countDocuments({
      storyId: id,
      userId: session.user.id,
    });

    // If userPreviousProposals is exactly 1 (meaning the one we just created), it's a new participant
    if (userPreviousProposals === 1) {
      await Story.findByIdAndUpdate(id, { $inc: { participantCount: 1 } });
    }

    return NextResponse.json({ proposal, message: "Proposal submitted successfully!" }, { status: 201 });
  } catch (error) {
    console.error(`[POST /api/stories/[id]/proposals]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const p = await params;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ error: "Story ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch proposals for this story, excluding those marked as 'loser'
    // Sorting by totalBidAmount DESC, then createdAt ASC
    const proposals = await Proposal.find({ 
      storyId: id,
      status: { $ne: "loser" } 
    }).sort({ totalBidAmount: -1, createdAt: 1 }).lean();

    let userVotedProposalId: string | null = null;
    let userVotedProposals: Record<string, boolean> = {}; // Keeping this as userBidProposals logic to avoid breaking frontend that might use it or changing it gently

    if (session?.user?.id) {
      // Find if they voted on any proposal for this story
      const vote = await Vote.findOne({
        userId: session.user.id,
        storyId: id,
      }).lean();

      if (vote) {
        userVotedProposalId = vote.proposalId.toString();
      }

      const proposalIds = proposals.map((p) => p._id);
      const bids = await Bid.find({
        userId: session.user.id,
        proposalId: { $in: proposalIds },
      }).lean();

      bids.forEach((bid: any) => {
        userVotedProposals[bid.proposalId.toString()] = true;
      });
    }

    const proposalsWithVoteStatus = proposals.map((p) => ({
      ...p,
      hasBid: !!userVotedProposals[p._id.toString()], // renaming to hasBid to clarify
      hasVoted: userVotedProposalId === p._id.toString() // new field for actual votes
    }));

    return NextResponse.json({ proposals: proposalsWithVoteStatus }, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/stories/[id]/proposals]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
