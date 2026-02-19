import express from "express";
import {
  Askquestion,
  deletequestion,
  getallquestion,
  getquestion,
  votequestion,
} from "../controller/question.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/ask", auth, Askquestion);
router.get("/getallquestion", getallquestion);
router.get("/:id", getquestion);
router.delete("/delete/:id", auth, deletequestion);
router.patch("/vote/:id", auth, votequestion);

export default router;
