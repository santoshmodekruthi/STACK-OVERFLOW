import Reward from "../models/Reward.js";
import PointsTransfer from "../models/PointsTransfer.js";
import User from "../models/User.js";

// Award points for answering a question
export const awardPointsForAnswer = async (req, res) => {
  try {
    const { answerId, userId } = req.body;

    // Award 5 points for answer
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.points += 5;
    await user.save();

    // Create reward record
    const reward = await Reward.create({
      userId,
      actionType: "answer_submitted",
      pointsAdded: 5,
      totalPointsAfterAction: user.points,
      answerId,
      description: "Points awarded for submitting an answer",
    });

    return res.status(200).json({
      message: "Points awarded for answer",
      pointsAdded: 5,
      totalPoints: user.points,
      reward,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error awarding points", error: error.message });
  }
};

// Award points when answer gets upvoted
export const awardPointsForUpvote = async (req, res) => {
  try {
    const { answerId, authorId, upvoteCount } = req.body;

    // Award 5 points when answer gets 5 upvotes
    if (upvoteCount % 5 === 0 && upvoteCount > 0) {
      const user = await User.findById(authorId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.points += 5;
      await user.save();

      const reward = await Reward.create({
        userId: authorId,
        actionType: "answer_upvoted",
        pointsAdded: 5,
        totalPointsAfterAction: user.points,
        answerId,
        description: `Answer reached ${upvoteCount} upvotes`,
      });

      return res.status(200).json({
        message: "Points awarded for upvote milestone",
        pointsAdded: 5,
        totalPoints: user.points,
      });
    }

    return res.status(200).json({
      message: "Upvote recorded",
      pointsAdded: 0,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error awarding upvote points", error: error.message });
  }
};

// Deduct points when answer is deleted
export const deductPointsForDeletedAnswer = async (req, res) => {
  try {
    const { answerId, authorId } = req.body;

    const user = await User.findById(authorId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Deduct 5 points (answer submission points)
    user.points = Math.max(0, user.points - 5);
    await user.save();

    const reward = await Reward.create({
      userId: authorId,
      actionType: "answer_deleted",
      pointsDeducted: 5,
      totalPointsAfterAction: user.points,
      answerId,
      description: "Points deducted for deleted answer",
    });

    return res.status(200).json({
      message: "Points deducted for deleted answer",
      pointsDeducted: 5,
      totalPoints: user.points,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error deducting points", error: error.message });
  }
};

// Deduct points for downvote
export const deductPointsForDownvote = async (req, res) => {
  try {
    const { answerId, authorId } = req.body;

    const user = await User.findById(authorId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Deduct 2 points for downvote
    user.points = Math.max(0, user.points - 2);
    await user.save();

    const reward = await Reward.create({
      userId: authorId,
      actionType: "answer_downvoted",
      pointsDeducted: 2,
      totalPointsAfterAction: user.points,
      answerId,
      description: "Points deducted for downvoted answer",
    });

    return res.status(200).json({
      message: "Points deducted for downvote",
      pointsDeducted: 2,
      totalPoints: user.points,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error deducting downvote points", error: error.message });
  }
};

// Get user points and rewards history
export const getUserRewards = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId).select("points badges");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const rewards = await Reward.find({ userId })
      .populate("userId", "name avatar email")
      .populate("relatedUserId", "name avatar email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Reward.countDocuments({ userId });

    return res.status(200).json({
      user: {
        points: user.points,
        badges: user.badges,
      },
      rewards,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching rewards", error: error.message });
  }
};

// Transfer points to another user
export const transferPoints = async (req, res) => {
  try {
    const fromUserId = req.userId;
    const { toUserId, pointsToTransfer } = req.body;

    if (!toUserId || !pointsToTransfer) {
      return res
        .status(400)
        .json({ message: "Please provide toUserId and pointsToTransfer" });
    }

    if (pointsToTransfer < 1) {
      return res.status(400).json({ message: "Points must be at least 1" });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has minimum 10 points to transfer
    if (fromUser.points < 10) {
      return res.status(403).json({
        message:
          "You need at least 10 points to transfer. Current points: " +
          fromUser.points,
      });
    }

    // Check if user has enough points
    if (fromUser.points < pointsToTransfer) {
      return res.status(403).json({
        message: `Insufficient points. You have ${fromUser.points} points`,
      });
    }

    // Deduct from sender
    fromUser.points -= pointsToTransfer;
    await fromUser.save();

    // Add to receiver
    toUser.points += pointsToTransfer;
    await toUser.save();

    // Create transfer record
    const transfer = await PointsTransfer.create({
      fromUser: fromUserId,
      toUser: toUserId,
      pointsTransferred: pointsToTransfer,
      status: "completed",
      completedAt: new Date(),
    });

    // Create reward records for both users
    await Reward.create({
      userId: fromUserId,
      actionType: "points_transferred",
      pointsDeducted: pointsToTransfer,
      totalPointsAfterAction: fromUser.points,
      relatedUserId: toUserId,
      description: `Transferred ${pointsToTransfer} points to ${toUser.name}`,
    });

    await Reward.create({
      userId: toUserId,
      actionType: "points_transferred",
      pointsAdded: pointsToTransfer,
      totalPointsAfterAction: toUser.points,
      relatedUserId: fromUserId,
      description: `Received ${pointsToTransfer} points from ${fromUser.name}`,
    });

    return res.status(200).json({
      message: "Points transferred successfully",
      transfer,
      fromUserPoints: fromUser.points,
      toUserPoints: toUser.points,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error transferring points", error: error.message });
  }
};

// Search users and get their profile
export const searchUserForTransfer = async (req, res) => {
  try {
    const { searchQuery } = req.query;

    if (!searchQuery || searchQuery.length < 2) {
      return res
        .status(400)
        .json({ message: "Please provide at least 2 characters" });
    }

    const users = await User.find(
      {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      },
      "name email avatar points badges"
    ).limit(10);

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error searching users", error: error.message });
  }
};

// Get user profile with points
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "name email avatar points badges about friends joinDate"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get recent rewards
    const recentRewards = await Reward.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      user,
      recentRewards,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching user profile", error: error.message });
  }
};

// Get transfer history
export const getTransferHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const transfers = await PointsTransfer.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .populate("fromUser", "name avatar email")
      .populate("toUser", "name avatar email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PointsTransfer.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }],
    });

    return res.status(200).json({
      transfers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching transfer history", error: error.message });
  }
};
