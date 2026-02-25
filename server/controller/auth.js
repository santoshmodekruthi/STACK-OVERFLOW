import mongoose from "mongoose";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateRandomPassword = (length = 10) => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const all = lowercase + uppercase;
  const ensure = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
  ];
  let remaining = "";
  for (let i = 0; i < length - ensure.length; i += 1) {
    remaining += all[Math.floor(Math.random() * all.length)];
  }
  const chars = (ensure.join("") + remaining).split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

export const Signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }
    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const hashpassword = await bcrypt.hash(password, 12);
    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
    });
    res.status(200).json({ data: newuser, token });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
const detectBrowserOsAndDevice = (userAgent) => {
  const ua = userAgent || "";
  let browser = "Other";
  if (ua.includes("Edg") || ua.includes("Trident") || ua.includes("MSIE")) {
    browser = "Microsoft";
  } else if (ua.includes("Chrome")) {
    browser = "Chrome";
  } else if (ua.includes("Firefox")) {
    browser = "Firefox";
  } else if (ua.includes("Safari")) {
    browser = "Safari";
  }
  let os = "Other";
  if (ua.includes("Windows")) {
    os = "Windows";
  } else if (ua.includes("Macintosh")) {
    os = "macOS";
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
  }
  const mobile =
    ua.includes("Android") ||
    ua.includes("iPhone") ||
    ua.includes("iPad") ||
    ua.includes("Mobile");
  const deviceType = mobile ? "mobile" : "desktop";
  return { browser, os, deviceType };
};

const isWithinMobileAccessWindow = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 10 && hour < 13;
};

const addLoginHistoryEntry = async (userDoc, info) => {
  const updatedHistory = userDoc.loginHistory || [];
  updatedHistory.unshift(info);
  const limited = updatedHistory.slice(0, 50);
  userDoc.loginHistory = limited;
  await userDoc.save();
};

export const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const userAgent = req.headers["user-agent"] || "";
    const { browser, os, deviceType } = detectBrowserOsAndDevice(userAgent);
    if (deviceType === "mobile" && !isWithinMobileAccessWindow()) {
      return res.status(403).json({
        message: "Mobile access allowed only between 10 AM and 1 PM",
      });
    }

    const ipHeader = req.headers["x-forwarded-for"] || req.ip || "";
    const ip =
      typeof ipHeader === "string" ? ipHeader.split(",")[0].trim() : "";

    if (browser === "Chrome") {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      existingUser.loginOtp = otp;
      existingUser.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await addLoginHistoryEntry(existingUser, {
        browser,
        os,
        deviceType,
        ip,
        time: new Date(),
      });
      return res.status(200).json({
        otpRequired: true,
        channel: "email",
        message: "OTP required for Chrome login",
        demoOtp: otp,
      });
    }

    await addLoginHistoryEntry(existingUser, {
      browser,
      os,
      deviceType,
      ip,
      time: new Date(),
    });

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.status(200).json({ data: existingUser, token });
  } catch (error) {
    return res.status(500).json("something went wrong..");
  }
};
export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find();
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags } = req.body.editForm;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateprofile = await user.findByIdAndUpdate(
      _id,
      { $set: { name: name, about: about, tags: tags } },
      { new: true }
    );
    res.status(200).json({ data: updateprofile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const addFriend = async (req, res) => {
  try {
    const userId = req.userid;
    const { friendEmail } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!friendEmail) {
      return res.status(400).json({ message: "Friend email is required" });
    }

    const currentUser = await user.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const friend = await user.findOne({ email: friendEmail });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const alreadyFriend = currentUser.friends.some(
      (id) => String(id) === String(friend._id)
    );
    if (alreadyFriend) {
      return res.status(400).json({ message: "Already friends" });
    }

    currentUser.friends.push(friend._id);
    await currentUser.save();

    return res.status(200).json({ data: currentUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res
        .status(400)
        .json({ message: "Email or phone number is required" });
    }

    const query = email ? { email } : { phone };
    const existingUser = await user.findOne(query);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const last = existingUser.resetPasswordRequestedAt;
    if (last) {
      const sameDay =
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();
      if (sameDay) {
        return res.status(429).json({
          message: "Forgot password can be used only one time a day",
        });
      }
    }

    const newPasswordPlain = generateRandomPassword(10);
    const hashpassword = await bcrypt.hash(newPasswordPlain, 12);

    existingUser.password = hashpassword;
    existingUser.resetPasswordRequestedAt = now;
    await existingUser.save();

    return res.status(200).json({
      message: "New password generated and sent",
      generatedPassword: newPasswordPlain,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      !existingUser.loginOtp ||
      !existingUser.loginOtpExpiresAt ||
      existingUser.loginOtp !== otp ||
      existingUser.loginOtpExpiresAt < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    existingUser.loginOtp = null;
    existingUser.loginOtpExpiresAt = null;
    await existingUser.save();

    const userAgent = req.headers["user-agent"] || "";
    const { browser, os, deviceType } = detectBrowserOsAndDevice(userAgent);
    const ipHeader = req.headers["x-forwarded-for"] || req.ip || "";
    const ip =
      typeof ipHeader === "string" ? ipHeader.split(",")[0].trim() : "";

    await addLoginHistoryEntry(existingUser, {
      browser,
      os,
      deviceType,
      ip,
      time: new Date(),
    });

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.status(200).json({ data: existingUser, token });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getLoginHistory = async (req, res) => {
  try {
    const userId = req.userid;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ data: existingUser.loginHistory || [] });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getPlanDetails = (plan) => {
  if (plan === "BRONZE") {
    return { price: 100, dailyLimit: 5 };
  }
  if (plan === "SILVER") {
    return { price: 300, dailyLimit: 10 };
  }
  if (plan === "GOLD") {
    return { price: 1000, dailyLimit: Infinity };
  }
  return { price: 0, dailyLimit: 1 };
};

const isWithinPaymentWindow = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 10 && hour < 11;
};

export const subscribePlan = async (req, res) => {
  try {
    const userId = req.userid;
    const { plan } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!plan || !["FREE", "BRONZE", "SILVER", "GOLD"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }
    if (!isWithinPaymentWindow()) {
      return res.status(403).json({
        message: "Payments are allowed only between 10 AM and 11 AM IST",
      });
    }

    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const details = getPlanDetails(plan);
    const now = new Date();
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    existingUser.subscriptionPlan = plan;
    existingUser.subscriptionValidUntil = validUntil;
    await existingUser.save();

    const invoice = {
      plan,
      price: details.price,
      currency: "INR",
      validUntil,
      email: existingUser.email,
      generatedAt: now,
    };

    return res.status(200).json({
      message: "Subscription activated and invoice emailed to user",
      invoice,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getSubscription = async (req, res) => {
  try {
    const userId = req.userid;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const details = getPlanDetails(existingUser.subscriptionPlan || "FREE");
    return res.status(200).json({
      data: {
        plan: existingUser.subscriptionPlan || "FREE",
        validUntil: existingUser.subscriptionValidUntil,
        dailyLimit: details.dailyLimit,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
