import mongoose from "mongoose";

const pointsTransferSchema = mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  pointsTransferred: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending"
  },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export default mongoose.models['points-transfer'] || mongoose.model("points-transfer", pointsTransferSchema);
