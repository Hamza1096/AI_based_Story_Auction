import mongoose, { Schema, Document } from "mongoose";

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  storyId: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    storyId: { type: Schema.Types.ObjectId, ref: "Story", required: true },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", required: true },
  },
  { timestamps: true }
);

// Ensure one vote per user per story
VoteSchema.index({ userId: 1, storyId: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model<IVote>("Vote", VoteSchema);
