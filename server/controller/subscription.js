import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-password",
  },
});

// Plan configurations
const PLANS = {
  free: {
    price: 0,
    questionsPerDay: 1,
    name: "Free Plan",
  },
  bronze: {
    price: 10000, // ₹100 in paise
    questionsPerDay: 5,
    name: "Bronze Plan",
  },
  silver: {
    price: 30000, // ₹300 in paise
    questionsPerDay: 10,
    name: "Silver Plan",
  },
  gold: {
    price: 100000, // ₹1000 in paise
    questionsPerDay: -1, // unlimited
    name: "Gold Plan",
  },
};

// Check if current time is within payment window (10 AM - 11 AM IST)
const isPaymentTimeValid = () => {
  const now = new Date();
  // Convert to IST
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const hours = istTime.getHours();
  return hours >= 10 && hours < 11;
};

// Initiate payment
export const initiatePayment = async (req, res) => {
  try {
    const { planType, paymentGateway } = req.body;
    const userId = req.userId;

    // Validate plan
    if (!PLANS[planType] || planType === "free") {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    // Check payment time
    if (!isPaymentTimeValid()) {
      return res.status(403).json({
        message:
          "Payments are only allowed between 10 AM - 11 AM IST. Please try again during this time window.",
      });
    }

    if (!["stripe", "razorpay"].includes(paymentGateway)) {
      return res.status(400).json({ message: "Invalid payment gateway" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const planPrice = PLANS[planType].price;

    // Create payment order based on gateway
    let paymentData;

    if (paymentGateway === "stripe") {
      // Stripe integration
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: PLANS[planType].name,
                description: `${PLANS[planType].questionsPerDay === -1 ? "Unlimited" : PLANS[planType].questionsPerDay} questions per day`,
              },
              unit_amount: planPrice,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/subscription/success?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        metadata: {
          userId,
          planType,
        },
      });

      paymentData = {
        sessionId: session.id,
        clientSecret: session.client_secret,
      };
    } else if (paymentGateway === "razorpay") {
      // Razorpay integration
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: planPrice,
        currency: "INR",
        receipt: `${userId}_${planType}_${Date.now()}`,
        notes: {
          userId,
          planType,
        },
      });

      paymentData = {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    }

    // Store payment record
    const payment = new Payment({
      userId,
      amount: planPrice,
      currency: "INR",
      planType,
      paymentGateway,
      status: "pending",
    });

    await payment.save();

    return res.status(200).json({
      message: "Payment initiated successfully",
      paymentId: payment._id,
      paymentData,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error initiating payment", error: error.message });
  }
};

// Verify payment and create subscription
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.userId;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    let isValidPayment = false;

    // Verify based on gateway
    if (payment.paymentGateway === "razorpay") {
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
      const generated_signature = hmac.digest("hex");

      isValidPayment = generated_signature === razorpaySignature;
    } else {
      // Stripe verification would be done via webhook
      isValidPayment = true;
    }

    if (!isValidPayment) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update payment status
    payment.status = "success";
    payment.paymentId = razorpayPaymentId || razorpayOrderId;
    await payment.save();

    // Create subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = new Subscription({
      userId,
      planType: payment.planType,
      price: payment.amount,
      currency: payment.currency,
      paymentId: payment.paymentId,
      status: "active",
      startDate: new Date(),
      endDate,
      questionLimitPerDay: PLANS[payment.planType].questionsPerDay,
      invoiceId: `INV-${payment._id}`,
    });

    await subscription.save();

    // Update user subscription
    const user = await User.findById(userId);
    user.subscriptionPlan = payment.planType;
    user.subscriptionEndDate = endDate;
    await user.save();

    // Send invoice email
    const invoiceHTML = generateInvoiceHTML(user, payment, PLANS[payment.planType]);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Invoice for ${PLANS[payment.planType].name}`,
      html: invoiceHTML,
    });

    return res.status(200).json({
      message: "Payment verified and subscription created successfully",
      subscription,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error verifying payment", error: error.message });
  }
};

// Get user subscription
export const getUserSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (!subscription) {
      return res.status(200).json({
        subscription: null,
        plan: "free",
        questionsLimit: 1,
      });
    }

    return res.status(200).json({
      subscription,
      plan: subscription.planType,
      questionsLimit: subscription.questionLimitPerDay,
      endDate: subscription.endDate,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching subscription", error: error.message });
  }
};

// Helper function to generate invoice HTML
const generateInvoiceHTML = (user, payment, planDetails) => {
  const invoiceDate = new Date().toLocaleDateString();
  const price = (payment.amount / 100).toFixed(2);

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .invoice-container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin: 20px 0; }
          .invoice-details table { width: 100%; border-collapse: collapse; }
          .invoice-details td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>Invoice</h1>
            <p>Invoice Date: ${invoiceDate}</p>
          </div>
          
          <div class="invoice-details">
            <h3>Bill To:</h3>
            <p><strong>${user.name}</strong><br>${user.email}</p>
            
            <h3>Plan Details:</h3>
            <table>
              <tr>
                <td><strong>Plan Name</strong></td>
                <td>${planDetails.name}</td>
              </tr>
              <tr>
                <td><strong>Amount</strong></td>
                <td>₹${price}</td>
              </tr>
              <tr>
                <td><strong>Questions Per Day</strong></td>
                <td>${planDetails.questionsPerDay === -1 ? "Unlimited" : planDetails.questionsPerDay}</td>
              </tr>
              <tr class="total">
                <td><strong>Total</strong></td>
                <td><strong>₹${price}</strong></td>
              </tr>
            </table>
          </div>
          
          <p>Thank you for your subscription!</p>
        </div>
      </body>
    </html>
  `;
};

// Check if user can post question
export const canPostQuestion = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    let questionLimit = 1; // default for free plan

    if (subscription) {
      questionLimit = subscription.questionLimitPerDay;
    }

    // Check if user already posted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let questionsPostedToday = 0;

    if (subscription) {
      if (subscription.lastQuestionDate >= today) {
        questionsPostedToday = subscription.questionsAskedToday;
      }
    }

    const canPost =
      questionLimit === -1 || questionsPostedToday < questionLimit;

    return res.status(200).json({
      canPost,
      questionsPostedToday,
      questionLimit: questionLimit === -1 ? "unlimited" : questionLimit,
      plan: user.subscriptionPlan,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error checking post availability", error: error.message });
  }
};
