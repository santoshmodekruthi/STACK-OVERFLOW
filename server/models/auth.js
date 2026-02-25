import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  points: { type: Number, default: 0 },
  phone: { type: String },
  subscriptionPlan: {
    type: String,
    enum: ["FREE", "BRONZE", "SILVER", "GOLD"],
    default: "FREE",
  },
  subscriptionValidUntil: { type: Date },
  forgotPasswordRequestedAt: { type: Date },
  loginHistory: [
    {
      browser: String,
      os: String,
      deviceType: String,
      ip: String,
      time: { type: Date, default: Date.now },
    },
  ],
  language: {
    type: String,
    enum: ["en", "es", "hi", "pt", "zh", "fr"],
    default: "en",
  },
  languageOtp: String,
  languageOtpExpiresAt: Date,
  loginOtp: String,
  loginOtpExpiresAt: Date,
  resetPasswordRequestedAt: { type: Date },
});
export default mongoose.model("user", userschema);
