import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * POST /api/webhook/stripe
 *
 * Stripe calls this after payment events.
 * IMPORTANT: This route must receive the RAW body for signature verification.
 * The `export const config` below disables Next.js body parsing for this route.
 *
 * On `checkout.session.completed`:
 *  1. Verify the Stripe signature
 *  2. Find the pending Transaction by stripeSessionId  (idempotency check)
 *  3. Mark Transaction as "completed"
 *  4. Atomically increment User.walletBalance
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // ── Verify signature ──────────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 });
  }

  // ── Handle events ─────────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Safety check — only handle paid sessions
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const { userId, amountGbp } = session.metadata ?? {};

    if (!userId || !amountGbp) {
      console.error("[Stripe Webhook] Missing metadata on session:", session.id);
      return NextResponse.json({ error: "Missing metadata." }, { status: 400 });
    }

    const amount = parseFloat(amountGbp);

    try {
      await connectToDatabase();

      // ── Idempotency check: find the pending transaction ───────────────────
      const transaction = await Transaction.findOne({ stripeSessionId: session.id });

      if (!transaction) {
        console.error("[Stripe Webhook] No pending transaction found for session:", session.id);
        // Still return 200 so Stripe doesn't retry; this may be a duplicate event
        return NextResponse.json({ received: true });
      }

      if (transaction.status === "completed") {
        // Already processed — idempotent response
        return NextResponse.json({ received: true });
      }

      // ── Mark transaction completed ────────────────────────────────────────
      transaction.status = "completed";
      transaction.stripePaymentIntentId = session.payment_intent as string;
      await transaction.save();

      // ── Atomically credit the user's wallet ───────────────────────────────
      await User.findByIdAndUpdate(userId, {
        $inc: { walletBalance: amount },
      });

      console.log(`[Stripe Webhook] Credited £${amount} to user ${userId}`);
    } catch (error) {
      console.error("[Stripe Webhook] DB error:", error);
      // Return 500 so Stripe will retry
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }
  }

  // Acknowledge all other event types without processing
  return NextResponse.json({ received: true });
}
