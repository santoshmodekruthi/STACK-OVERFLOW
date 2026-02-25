import express from "express";
import {
  addFriend,
  getallusers,
  Login,
  Signup,
  updateprofile,
  forgotPassword,
  verifyLoginOtp,
  getLoginHistory,
  subscribePlan,
  getSubscription,
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/signup", Signup);
router.post("/login", Login);
router.get("/getalluser", getallusers);
router.patch("/update/:id", auth, updateprofile);
router.post("/friends/add", auth, addFriend);
router.post("/forgot-password", forgotPassword);
router.post("/verify-login-otp", verifyLoginOtp);
router.get("/login-history", auth, getLoginHistory);
router.post("/subscribe", auth, subscribePlan);
router.get("/subscription", auth, getSubscription);
export default router;
