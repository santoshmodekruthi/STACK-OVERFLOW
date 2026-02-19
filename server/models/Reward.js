import mongoose from "mongoose";

const rewardSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  
  // Type of reward action
  actionType: {
    type: String,
    enum: [
      "answer_submitted",
      "answer_upvoted",
      "question_answered",
      "post_liked",
      "post_created",
      "points_transferred",
      "answer_deleted",
      "answer_downvoted"
    ],
    required: true
  },
  
  // Points change
  pointsAdded: { type: Number, default: 0 },
  pointsDeducted: { type: Number, default: 0 },
  totalPointsAfterAction: { type: Number, required: true },
  
  // Related entities
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "question" },
  answerId: { type: mongoose.Schema.Types.ObjectId, ref: "answer" },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "post" },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // For transfers
  
  // Description
  description: { type: String },
  
  // Badges earned (if any)
  badgeEarned: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.reward || mongoose.model("reward", rewardSchema);
