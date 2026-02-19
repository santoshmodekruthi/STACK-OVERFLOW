import User from "../models/User.js";
import OTP from "../models/OTP.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Configure email transporter (update with your email credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-password",
  },
});

// Generate random password (uppercase, lowercase, no special chars or numbers)
const generatePassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request forgot password
export const requestForgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res
        .status(400)
        .json({ message: "Please provide email or phone number" });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already requested today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastForgotPasswordRequest >= today) {
      return res.status(429).json({
        message:
          "You can only request password reset once per day. Use only once!",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await OTP.create({
      userId: user._id,
      otp,
      otpType: email ? "email" : "phone",
      email: email || undefined,
      phone: phone || undefined,
      expiresAt,
    });

    // Send OTP via email
    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `
          <h2>Password Reset Request</h2>
          <p>Your OTP for password reset is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    }

    // Update forgot password request count
    user.forgotPasswordRequests += 1;
    user.lastForgotPasswordRequest = new Date();
    await user.save();

    return res.status(200).json({
      message: `OTP sent to ${email ? "email" : "phone"} successfully`,
      userId: user._id,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error requesting password reset", error: error.message });
  }
};

// Verify OTP and send new password
export const verifyOTPAndResetPassword = async (req, res) => {
  try {
    const { userId, otp, method } = req.body;

    if (!userId || !otp || !method) {
      return res
        .status(400)
        .json({ message: "Please provide userId, otp, and method" });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      userId,
      otp,
      otpType: method,
      isUsed: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Generate random password
    const newPassword = generatePassword();

    // Find user and update password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash password (using bcryptjs - make sure it's imported)
    import("bcryptjs")
      .then(async (bcryptjs) => {
        const hashedPassword = await bcryptjs.default.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Send new password via email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Your New Password",
          html: `
            <h2>Password Reset Successful</h2>
            <p>Your new password is: <strong>${newPassword}</strong></p>
            <p>Please keep this password safe and change it after logging in.</p>
            <p><a href="${process.env.FRONTEND_URL}/auth">Login here</a></p>
          `,
        });

        return res.status(200).json({
          message: "Password reset successful. New password sent to your email.",
          userId: user._id,
        });
      })
      .catch((error) => {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Error resetting password", error: error.message });
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};

// Get forgot password request count for today
export const getForgotPasswordStatus = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const canRequestPasswordReset =
      !user.lastForgotPasswordRequest || user.lastForgotPasswordRequest < today;

    return res.status(200).json({
      canRequest: canRequestPasswordReset,
      requestsToday: user.forgotPasswordRequests,
      lastRequestTime: user.lastForgotPasswordRequest,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching status", error: error.message });
  }
};
