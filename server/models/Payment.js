import mongoose from "mongoose";

const paymentSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  amount: { type: Number, required: true }, // in paise or cents
  currency: { type: String, default: "INR" },
  planType: {
    type: String,
    enum: ["bronze", "silver", "gold"],
    required: true
  },
  
  // Payment gateway details
  paymentGateway: {
    type: String,
    enum: ["stripe", "razorpay"],
    required: true
  },
  paymentId: { type: String, required: true }, // Stripe or Razorpay payment ID
  transactionId: { type: String },
  
  // Payment status
  status: {
    type: String,
    enum: ["success", "failed", "pending", "cancelled"],
    default: "pending"
  },
  
  // Invoice
  invoiceId: { type: String },
  invoiceUrl: { type: String },
  
  // Metadata
  paymentMethod: { type: String }, // card, netbanking, upi, etc
  last4: { type: String }, // Last 4 digits of card
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.payment || mongoose.model("payment", paymentSchema);
