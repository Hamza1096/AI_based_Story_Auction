import { NextResponse } from "next/server";
import { closeExpiredAuctions } from "@/lib/auctionCron";

/**
 * GET /api/cron/auction-close
 *
 * Manual endpoint to trigger auction closure (useful for testing).
 * In production, the automatic scheduler in instrumentation.ts handles this every hour.
 */
export async function GET() {
  try {
    await closeExpiredAuctions();
    return NextResponse.json({ success: true, message: "Auction close check completed." });
  } catch (error) {
    console.error("[GET /api/cron/auction-close]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
