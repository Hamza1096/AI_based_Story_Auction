import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/wallet/balance
 * Returns the live wallet balance from the DB (not from JWT session, which may be stale).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select("walletBalance").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ balance: (user as { walletBalance?: number }).walletBalance ?? 0 }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/wallet/balance]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
