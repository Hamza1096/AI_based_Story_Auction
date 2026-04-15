/**
 * auctionConfig.ts — Hardcoded auction settlement percentages.
 *
 * ⚠️  Replace the placeholder values below with the client-confirmed numbers.
 *     All settlement logic in auctionCron.ts reads from this file exclusively.
 *
 * How the math works
 * ──────────────────
 * WINNER bids (bids placed on the winning proposal):
 *   • WINNER_PLATFORM_FEE_PCT  → kept by the platform (already gone from bidder wallet)
 *   • WINNER_AUTHOR_SHARE_PCT  → credited to the proposal author's wallet
 *   • Remainder                → consumed (the "cost" of backing the winning story direction)
 *
 * LOSER bids (bids placed on a losing proposal):
 *   • LOSER_PLATFORM_FEE_PCT   → kept by the platform (already gone from bidder wallet)
 *   • LOSER_AUTHOR_SHARE_PCT   → credited to the proposal author's wallet
 *   • Remainder                → refunded to the bidder's wallet
 *
 * Constraints (enforced at runtime in auctionCron.ts):
 *   WINNER: PLATFORM_FEE + AUTHOR_SHARE must be ≤ 100
 *   LOSER:  PLATFORM_FEE + AUTHOR_SHARE must be ≤ 100
 */

export const AUCTION_CONFIG = {
  // ── Winning proposal bids ─────────────────────────────────────────────────
  /** % of each winning bid kept by the platform  (TODO: replace with client value) */
  WINNER_PLATFORM_FEE_PCT: 10,

  /** % of each winning bid credited to the proposal author  (TODO: replace with client value) */
  WINNER_AUTHOR_SHARE_PCT: 20,

  // ── Losing proposal bids ──────────────────────────────────────────────────
  /** % of each losing bid kept by the platform  (TODO: replace with client value) */
  LOSER_PLATFORM_FEE_PCT: 5,

  /** % of each losing bid credited to the proposal author  (TODO: replace with client value) */
  LOSER_AUTHOR_SHARE_PCT: 10,

  // Loser refund = 100 - LOSER_PLATFORM_FEE_PCT - LOSER_AUTHOR_SHARE_PCT
  // (calculated dynamically in auctionCron.ts — do not add a field here)
} as const;
