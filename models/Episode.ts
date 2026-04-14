import mongoose, { Schema, model, models } from "mongoose";

const EpisodePartSchema = new Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["winner", "gap"],
      required: true,
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
    },
  },
  { _id: false }
);

const EpisodeSchema = new Schema(
  {
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    episodeNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    parts: {
      type: [EpisodePartSchema],
      default: [],
    },
    content: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

EpisodeSchema.index({ storyId: 1, episodeNumber: 1 }, { unique: true });

const Episode = models.Episode || model("Episode", EpisodeSchema);

export default Episode;
