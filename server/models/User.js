import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  about: { type: String },
  tags: { type: [String] },
  avatar: { type: String },
  joinDate: { type: Date, default: Date.now },
  
  // Friends and connections
  friends: { type: [mongoose.Schema.Types.ObjectId], ref: "user", default: [] },
  friendRequests: { type: [mongoose.Schema.Types.ObjectId], ref: "user", default: [] },
  
  // Reward system
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  
  // Subscription
  subscriptionPlan: { 
    type: String, 
    enum: ["free", "bronze", "silver", "gold"], 
    default: "free" 
  },
  subscriptionEndDate: { type: Date },
  questionsPostedToday: { type: Number, default: 0 },
  lastQuestionPostDate: { type: Date },
  
  // Password reset
  forgotPasswordRequests: { type: Number, default: 0 },
  lastForgotPasswordRequest: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // Language preference
  preferredLanguage: { type: String, default: "english" },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  
  // Multi-language verification
  emailVerificationToken: { type: String },
  phoneVerificationToken: { type: String },
  
  // Public space
  postsCreatedToday: { type: Number, default: 0 },
  lastPostDate: { type: Date },
  
  // Login history
  loginHistory: [{
    loginDate: { type: Date, default: Date.now },
    ipAddress: { type: String },
    deviceType: { type: String }, // desktop, mobile, tablet
    browserType: { type: String }, // chrome, firefox, edge, safari, etc
    osType: { type: String }, // windows, macos, linux, android, ios
    userAgent: { type: String },
    city: { type: String },
    country: { type: String }
  }],
  
  lastActiveDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.user || mongoose.model("user", userSchema);
