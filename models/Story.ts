import mongoose, { Schema, model, models } from "mongoose";

const StorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    genre: {
      type: String,
      required: true,
      enum: [
        "Fantasy",
        "Science Fiction",
        "Mystery",
        "Romance",
        "Horror",
        "Thriller",
        "Adventure",
        "Historical Fiction",
        "Comedy",
        "Drama",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
      // NOTE: Description is intentionally NOT editable after creation per spec.
      // The API enforces this by excluding description from PATCH/PUT updates.
    },
    rules: {
      type: [String],
      default: [],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },
    chapterCount: {
      type: Number,
      default: 0,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for efficient querying by author and public story feed
StorySchema.index({ author: 1, createdAt: -1 });
StorySchema.index({ status: 1, createdAt: -1 });

const Story = models.Story || model("Story", StorySchema);

export default Story;
