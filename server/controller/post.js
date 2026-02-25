import mongoose from "mongoose";
import Post from "../models/post.js";
import User from "../models/auth.js";

const getPostLimitForUser = (friendCount) => {
  if (!friendCount || friendCount === 0) {
    return 0;
  }
  if (friendCount === 2) {
    return 2;
  }
  if (friendCount > 10) {
    return Infinity;
  }
  return 1;
};

export const createPost = async (req, res) => {
  try {
    const userId = req.userid;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendCount = user.friends ? user.friends.length : 0;
    const limit = getPostLimitForUser(friendCount);

    if (limit === 0) {
      return res
        .status(403)
        .json({ message: "You need friends before you can post in public space" });
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const todaysPostCount = await Post.countDocuments({
      userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (Number.isFinite(limit) && todaysPostCount >= limit) {
      return res.status(403).json({
        message: `Daily post limit reached. You can post ${limit} time(s) per day.`,
      });
    }

    const { content, imageUrl, videoUrl } = req.body;

    if (!content && !imageUrl && !videoUrl) {
      return res
        .status(400)
        .json({ message: "Content, image, or video is required" });
    }

    const post = await Post.create({
      userId,
      content,
      imageUrl,
      videoUrl,
    });

    const populated = await post.populate("userId", "name email");

    return res.status(201).json({ data: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const listPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .lean();
    return res.status(200).json({ data: posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const userId = req.userid;
    const { id } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Post unavailable" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const index = post.likes.findIndex(
      (uid) => String(uid) === String(userId)
    );
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    const updated = await post.save();
    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const addComment = async (req, res) => {
  try {
    const userId = req.userid;
    const { id } = req.params;
    const { text } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Post unavailable" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      userId,
      text,
    });

    const updated = await post.save();
    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Post unavailable" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.shareCount += 1;
    const updated = await post.save();
    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

