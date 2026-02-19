import express from "express";
import {
  requestForgotPassword,
  verifyOTPAndResetPassword,
  getForgotPasswordStatus,
} from "../controller/forgotPassword.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/request", requestForgotPassword);
router.post("/verify-otp", verifyOTPAndResetPassword);
router.get("/status", protect, getForgotPasswordStatus);

export default router;
