import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  otp: { type: String, required: true },
  otpType: {
    type: String,
    enum: ["email", "phone", "language_change"],
    required: true
  },
  email: { type: String },
  phone: { type: String },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.otp || mongoose.model("otp", otpSchema);
