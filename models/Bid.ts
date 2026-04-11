import mongoose, { Schema, model, models } from "mongoose";

const BidSchema = new Schema(
  {
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // Minimum bid amount
    },
  },
  { timestamps: true } // Creates createdAt for tie breakers (AS-19)
);

// Index to easily fetch bids for a user or proposal
BidSchema.index({ proposalId: 1, createdAt: -1 });

const Bid = models.Bid || model("Bid", BidSchema);

export default Bid;
