import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    content: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    shareCount: { type: Number, default: 0 },
    comments: [commentSchema],
  },
  { timestamps: true }
);

export default mongoose.model("post", postSchema);

