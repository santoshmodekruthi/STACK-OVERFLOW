import Post from "../models/Post.js";
import User from "../models/User.js";
import Reward from "../models/Reward.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { caption, images, videos } = req.body;
    const userId = req.userId; // from auth middleware

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check friend requirement
    if (user.friends.length === 0) {
      return res.status(403).json({
        message: "You must have at least 1 friend to post on the public space",
      });
    }

    // Check daily post limit based on friends
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let postLimit = 1;
    if (user.friends.length >= 10) {
      postLimit = Infinity;
    } else if (user.friends.length >= 2) {
      postLimit = user.friends.length;
    } else {
      postLimit = 1;
    }

    // Reset post count if last post was yesterday
    if (!user.lastPostDate || user.lastPostDate < today) {
      user.postsCreatedToday = 0;
    }

    if (user.postsCreatedToday >= postLimit) {
      return res.status(403).json({
        message: `You have reached your daily post limit of ${postLimit}`,
      });
    }

    // Create post
    const newPost = new Post({
      author: userId,
      caption,
      images: images || [],
      videos: videos || [],
    });

    await newPost.save();

    // Update user post count
    user.postsCreatedToday += 1;
    user.lastPostDate = new Date();
    await user.save();

    // Award points for creating a post
    await Reward.create({
      userId,
      actionType: "post_created",
      pointsAdded: 2,
      totalPointsAfterAction: user.points + 2,
      postId: newPost._id,
      description: "Points awarded for creating a post",
    });

    user.points += 2;
    await user.save();

    // Populate author details
    const populatedPost = await Post.findById(newPost._id).populate(
      "author",
      "name avatar email"
    );

    return res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error creating post", error: error.message });
  }
};

// Get all public posts (feed)
export const getPublicFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find()
      .populate("author", "name avatar email points")
      .populate({
        path: "comments.commentBy",
        select: "name avatar email",
      })
      .populate({
        path: "likes",
        select: "name avatar email",
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments();

    return res.status(200).json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error fetching feed", error: error.message });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);

      // Award points to post author if post gets 5 likes
      if (post.likes.length % 5 === 0) {
        const author = await User.findById(post.author);
        author.points += 5;
        await author.save();

        await Reward.create({
          userId: post.author,
          actionType: "post_liked",
          pointsAdded: 5,
          totalPointsAfterAction: author.points,
          postId: postId,
          description: `Post received ${post.likes.length} likes`,
        });
      }
    }

    await post.save();

    return res.status(200).json({
      message: isLiked ? "Post unliked" : "Post liked successfully",
      likes: post.likes.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error liking post", error: error.message });
  }
};

// Comment on a post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { commentText } = req.body;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = {
      commentBy: userId,
      commentText,
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment
    const populatedPost = await Post.findById(postId)
      .populate({
        path: "comments.commentBy",
        select: "name avatar email",
      });

    return res.status(201).json({
      message: "Comment added successfully",
      comments: populatedPost.comments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error adding comment", error: error.message });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    // Deduct points for post creation
    const user = await User.findById(userId);
    user.points = Math.max(0, user.points - 2);
    await user.save();

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error deleting post", error: error.message });
  }
};

// Share a post
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.shares += 1;
    await post.save();

    return res.status(200).json({
      message: "Post shared successfully",
      shares: post.shares,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error sharing post", error: error.message });
  }
};
