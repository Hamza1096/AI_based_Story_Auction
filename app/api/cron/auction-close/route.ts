import { NextResponse } from "next/server";
import { closeExpiredAuctions } from "@/lib/auctionCron";

/**
 * GET /api/cron/auction-close
 *
 * Manual endpoint to trigger auction closure (useful for testing).
 * In production, the automatic scheduler in instrumentation.ts handles this every hour.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isManual = searchParams.get("manual") === "1";
    const storyId = searchParams.get("storyId") || undefined;

    await closeExpiredAuctions({
      force: isManual,
      storyId,
    });

    return NextResponse.json({
      success: true,
      message: isManual
        ? "Manual auction close completed."
        : "Auction close check completed.",
    });
  } catch (error) {
    console.error("[GET /api/cron/auction-close]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
