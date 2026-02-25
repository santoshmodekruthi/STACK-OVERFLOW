import express from "express";
import { addComment, createPost, listPosts, sharePost, toggleLike } from "../controller/post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", listPosts);
router.post("/", auth, createPost);
router.post("/:id/like", auth, toggleLike);
router.post("/:id/comment", auth, addComment);
router.post("/:id/share", auth, sharePost);

export default router;

