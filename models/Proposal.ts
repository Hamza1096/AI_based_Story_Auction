import mongoose, { Schema, model, models } from "mongoose";

const ProposalSchema = new Schema(
  {
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes to quickly find proposals by user on a given story (useful for checking 1-per-day restriction)
// and to query all proposals for a specific story
ProposalSchema.index({ storyId: 1, userId: 1, createdAt: -1 });

const Proposal = models.Proposal || model("Proposal", ProposalSchema);

export default Proposal;
