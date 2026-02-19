import express from "express";
import {
  recordLoginAttempt,
  verifyLoginOTP,
  getLoginHistory,
  getActiveSessions,
  logout,
  revokeAllSessions,
} from "../controller/loginHistory.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/record", recordLoginAttempt);
router.post("/verify-otp", verifyLoginOTP);
router.get("/history", protect, getLoginHistory);
router.get("/active-sessions", protect, getActiveSessions);
router.post("/logout", logout);
router.post("/revoke-all-sessions", protect, revokeAllSessions);

export default router;
