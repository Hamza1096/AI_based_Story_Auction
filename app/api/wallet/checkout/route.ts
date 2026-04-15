import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

// Allowed top-up amounts in GBP (pence for Stripe, pounds for display)
const ALLOWED_AMOUNTS_GBP = [5, 10, 20, 50];

/**
 * POST /api/wallet/checkout
 * Creates a Stripe Checkout Session for wallet top-up.
 * Body: { amount: 5 | 10 | 20 | 50 }  (in GBP pounds)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount: number = body.amount;

    if (!ALLOWED_AMOUNTS_GBP.includes(amount)) {
      return NextResponse.json(
        { error: `Invalid amount. Allowed values: ${ALLOWED_AMOUNTS_GBP.join(", ")} GBP.` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify user exists
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Build the base URL for Stripe redirect URLs.
    // Priority: explicit NEXTAUTH_URL → Vercel's auto-set VERCEL_URL → localhost (dev)
    // VERCEL_URL is injected by Vercel on every deployment without needing manual config.
    const appUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: amount * 100, // Stripe uses pence
            product_data: {
              name: "The Astral Loom — Wallet Top-up",
              description: `Add £${amount.toFixed(2)} to your bidding wallet`,
            },
          },
          quantity: 1,
        },
      ],
      // Stripe will redirect here after payment
      success_url: `${appUrl}/dashboard/wallet?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/wallet?status=cancelled`,
      // Store user info for the webhook
      metadata: {
        userId: session.user.id,
        amountGbp: amount.toString(),
      },
      customer_email: session.user.email ?? undefined,
    });

    // Record a PENDING transaction now — webhook will mark it completed
    await Transaction.create({
      userId: session.user.id,
      type: "credit",
      amount: amount,
      status: "pending",
      description: `Wallet top-up via Stripe (£${amount.toFixed(2)})`,
      stripeSessionId: checkoutSession.id,
    });

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/wallet/checkout]", error);
    return NextResponse.json({ error: "Failed to create payment session." }, { status: 500 });
  }
}
