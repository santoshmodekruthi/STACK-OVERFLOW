import express from "express";
import {
  requestLanguageChange,
  verifyLanguageChangeOTP,
  getUserLanguage,
  getSupportedLanguages,
  getTranslations,
} from "../controller/language.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/change-request", protect, requestLanguageChange);
router.post("/verify-change", protect, verifyLanguageChangeOTP);
router.get("/user-language", protect, getUserLanguage);
router.get("/supported-languages", getSupportedLanguages);
router.get("/translations", getTranslations);

export default router;
