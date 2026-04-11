import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

/**
 * GET /api/wallet/transactions
 * Returns the authenticated user's last 50 transactions, newest first.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const transactions = await Transaction.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/wallet/transactions]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
