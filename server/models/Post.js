import mongoose from "mongoose";

const postSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  caption: { type: String, required: true },
  images: { type: [String], default: [] }, // Array of image URLs
  videos: { type: [String], default: [] }, // Array of video URLs
  
  // Engagement
  likes: { 
    type: [mongoose.Schema.Types.ObjectId],
    ref: "user",
    default: []
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // Comments
  comments: [{
    commentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    commentText: String,
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "user",
      default: []
    },
    createdAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.post || mongoose.model("post", postSchema);
