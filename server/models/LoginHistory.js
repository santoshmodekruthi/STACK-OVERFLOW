import mongoose from "mongoose";

const loginHistorySchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  
  // Device information
  deviceType: { type: String }, // desktop, mobile, tablet
  browserType: { type: String }, // chrome, firefox, edge, safari, opera
  browserVersion: { type: String },
  osType: { type: String }, // windows, macos, linux, android, ios
  osVersion: { type: String },
  userAgent: { type: String },
  
  // Network information
  ipAddress: { type: String, required: true },
  city: { type: String },
  country: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  
  // Session information
  sessionId: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
  logoutTime: { type: Date },
  
  // Authentication method
  authMethod: {
    type: String,
    enum: ["password", "otp", "google", "facebook"],
    default: "password"
  },
  otpVerified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models['login-history'] || mongoose.model("login-history", loginHistorySchema);
