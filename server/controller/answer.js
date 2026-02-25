import mongoose from "mongoose";
import question from "../models/question.js";
import user from "../models/auth.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { noofanswer, answerbody, useranswered, userid } = req.body;
  updatenoofanswer(_id, noofanswer);

  try {
    const updatequestion = await question.findByIdAndUpdate(_id, {
      $addToSet: {
        answer: [
          {
            answerbody,
            useranswered,
            userid,
          },
        ],
      },
    });

    if (userid && mongoose.Types.ObjectId.isValid(userid)) {
      await user.findByIdAndUpdate(userid, { $inc: { points: 5 } });
    }

    res.status(200).json({ data: updatequestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};
const updatenoofanswer = async (_id, noofanswer) => {
  try {
    await question.findByIdAndUpdate(_id, { $set: { noofanswer: noofanswer } });
  } catch (error) {
    console.log(error);
  }
};
export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { noofanswer, answerid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  updatenoofanswer(_id, noofanswer);
  try {
    const existingQuestion = await question.findById(_id);
    if (!existingQuestion) {
      return res.status(404).json({ message: "question unavailable" });
    }
    const answerDoc = existingQuestion.answer.id(answerid);
    if (answerDoc && answerDoc.userid) {
      let deduction = 5;
      if (answerDoc.rewardGivenForFiveUpvotes) {
        deduction += 5;
      }
      await user.findByIdAndUpdate(answerDoc.userid, {
        $inc: { points: -deduction },
      });
    }

    const updatequestion = await question.updateOne(
      { _id },
      {
        $pull: { answer: { _id: answerid } },
      }
    );
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

export const voteAnswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerId, userid, value } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  if (!userid || !mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const existingQuestion = await question.findById(_id);
    if (!existingQuestion) {
      return res.status(404).json({ message: "question unavailable" });
    }
    const ans = existingQuestion.answer.id(answerId);
    if (!ans) {
      return res.status(404).json({ message: "answer unavailable" });
    }

    const upIndex = ans.upvote.findIndex((id) => id === String(userid));
    const downIndex = ans.downvote.findIndex((id) => id === String(userid));

    if (value === "upvote") {
      if (downIndex !== -1) {
        ans.downvote = ans.downvote.filter((id) => id !== String(userid));
      }
      if (upIndex === -1) {
        ans.upvote.push(userid);
      } else {
        ans.upvote = ans.upvote.filter((id) => id !== String(userid));
      }

      if (
        ans.upvote.length >= 5 &&
        !ans.rewardGivenForFiveUpvotes &&
        ans.userid
      ) {
        await user.findByIdAndUpdate(ans.userid, { $inc: { points: 5 } });
        ans.rewardGivenForFiveUpvotes = true;
      }
    } else if (value === "downvote") {
      if (upIndex !== -1) {
        ans.upvote = ans.upvote.filter((id) => id !== String(userid));
      }
      if (downIndex === -1) {
        ans.downvote.push(userid);
        if (ans.userid) {
          await user.findByIdAndUpdate(ans.userid, { $inc: { points: -1 } });
        }
      } else {
        ans.downvote = ans.downvote.filter((id) => id !== String(userid));
      }
    }

    await existingQuestion.save();
    return res.status(200).json({ data: existingQuestion });
  } catch (error) {
    return res.status(500).json("something went wrong..");
  }
};
