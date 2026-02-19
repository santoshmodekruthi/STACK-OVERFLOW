import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  planType: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
    required: true
  },
  price: { type: Number, required: true }, // in paise or cents
  currency: { type: String, default: "INR" },
  
  // Payment details
  paymentId: { type: String }, // Stripe or Razorpay payment ID
  status: {
    type: String,
    enum: ["active", "inactive", "cancelled", "pending"],
    default: "pending"
  },
  
  // Dates
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  renewalDate: { type: Date },
  autoRenew: { type: Boolean, default: true },
  
  // Daily question limits for this plan
  questionLimitPerDay: {
    type: Number,
    default: 1
  },
  questionsAskedToday: { type: Number, default: 0 },
  lastQuestionDate: { type: Date },
  
  // Invoice
  invoiceId: { type: String },
  invoiceUrl: { type: String },
  invoiceSentAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.subscription || mongoose.model("subscription", subscriptionSchema);
