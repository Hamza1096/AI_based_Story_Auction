import mongoose, { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      // Stored in GBP pounds (e.g. 10.00 = £10)
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    description: {
      type: String,
      default: "",
    },
    // Stripe-specific fields for reconciliation & idempotency
    stripeSessionId: {
      type: String,
      sparse: true, // null for non-Stripe transactions (e.g. debit for bidding)
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Fast lookup by user, newest-first
TransactionSchema.index({ userId: 1, createdAt: -1 });
// Idempotency — prevent duplicate credits for same Stripe session
TransactionSchema.index({ stripeSessionId: 1 }, { sparse: true, unique: true });

const Transaction = models.Transaction || model("Transaction", TransactionSchema);

export default Transaction;
