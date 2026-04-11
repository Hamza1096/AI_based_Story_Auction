import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Proposal from "@/models/Proposal";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Bid from "@/models/Bid";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Minimum bid is 1." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userId = session.user.id;

    // Find the proposal
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    if (proposal.status !== "pending") {
      return NextResponse.json({ error: "Bidding is closed for this proposal." }, { status: 400 });
    }

    // Find the user to check wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.walletBalance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
    }

    // Process the bid (Deduct wallet, Create Transaction, Create Bid, Update Proposal)
    user.walletBalance -= amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: "debit",
      amount: amount,
      status: "completed",
      description: `Placed bid on proposal for story ${proposal.storyId}`,
    });

    const bid = await Bid.create({
      proposalId: proposal._id,
      userId: user._id,
      amount: amount,
    });

    proposal.totalBidAmount += amount;
    await proposal.save();

    return NextResponse.json({ success: true, message: "Bid placed successfully.", bid }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/proposals/[id]/bid]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
