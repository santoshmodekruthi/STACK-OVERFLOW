import express from "express";
import {
  awardPointsForAnswer,
  awardPointsForUpvote,
  deductPointsForDeletedAnswer,
  deductPointsForDownvote,
  getUserRewards,
  transferPoints,
  searchUserForTransfer,
  getUserProfile,
  getTransferHistory,
} from "../controller/reward.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/award-answer", protect, awardPointsForAnswer);
router.post("/award-upvote", protect, awardPointsForUpvote);
router.post("/deduct-answer-deleted", protect, deductPointsForDeletedAnswer);
router.post("/deduct-downvote", protect, deductPointsForDownvote);
router.get("/history/:userId", getUserRewards);
router.post("/transfer", protect, transferPoints);
router.get("/search-user", protect, searchUserForTransfer);
router.get("/profile/:userId", getUserProfile);
router.get("/transfers/history", protect, getTransferHistory);

export default router;
