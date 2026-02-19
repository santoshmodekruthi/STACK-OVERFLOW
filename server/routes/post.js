import express from "express";
import {
  createPost,
  getPublicFeed,
  likePost,
  addComment,
  deletePost,
  sharePost,
} from "../controller/post.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", protect, createPost);
router.get("/feed", getPublicFeed);
router.post("/:postId/like", protect, likePost);
router.post("/:postId/comment", protect, addComment);
router.delete("/:postId", protect, deletePost);
router.post("/:postId/share", sharePost);

export default router;
