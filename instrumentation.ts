/**
 * instrumentation.ts — Next.js server startup hook.
 *
 * The `register()` function is automatically called by Next.js once when
 * the server process initialises. We use it to start a background scheduler
 * that checks for and closes expired auctions every hour.
 *
 * Docs: https://nextjs.org/docs/app/guides/instrumentation
 */

// Global flag prevents duplicate intervals when Next.js hot-reloads in dev
const globalForCron = global as typeof global & { auctionCronStarted?: boolean };

export async function register() {
  // Only run in the Node.js runtime (not in the Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (globalForCron.auctionCronStarted) {
      return; // Already running — skip duplicate registration on hot-reload
    }
    globalForCron.auctionCronStarted = true;

    const { closeExpiredAuctions } = await import("./lib/auctionCron");

    const ONE_HOUR = 60 * 60 * 1000;

    console.log("[AuctionCron] Scheduler started. Checking every hour.");

    // Run once immediately on server start to catch any auctions that expired while server was down
    closeExpiredAuctions();

    // Then run every hour automatically
    setInterval(() => {
      console.log("[AuctionCron] Running scheduled check...");
      closeExpiredAuctions();
    }, ONE_HOUR);
  }
}
