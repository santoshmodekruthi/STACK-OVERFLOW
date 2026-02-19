import express from "express";
import {
  initiatePayment,
  verifyPayment,
  getUserSubscription,
  canPostQuestion,
} from "../controller/subscription.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/initiate", protect, initiatePayment);
router.post("/verify", protect, verifyPayment);
router.get("/my-subscription", protect, getUserSubscription);
router.get("/can-post-question", protect, canPostQuestion);

export default router;
