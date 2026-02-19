import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  History,
  Share,
  Trash,
} from "lucide-react";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  questionId?: string;
}

const QuestionDetail = ({ questionId }: Props) => {
  const { user } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================= FETCH QUESTION =================
  useEffect(() => {
    if (!questionId) return;

    const fetchQuestion = async () => {
      try {
        const res = await axiosInstance.get(`/question/${questionId}`);
        setQuestion(res.data.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load question");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  // ================= VOTE =================
  const handleVote = async (type: string) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }

    try {
      const res = await axiosInstance.patch(
        `/question/vote/${question._id}`,
        {
          value: type,
          userid: user._id,
        }
      );

      if (res.data.data) {
        setQuestion(res.data.data);
        toast.success("Vote updated");
      }
    } catch (error) {
      console.error(error);
      toast.error("Vote failed");
    }
  };

  // ================= BOOKMARK =================
  const handleBookmark = () => {
    setQuestion((prev: any) => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
    }));
  };

  // ================= POST ANSWER =================
  const handleSubmitAnswer = async () => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }

    if (!newAnswer.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await axiosInstance.post(
        `/answer/postanswer/${question._id}`,
        {
          noofanswer: question.noofanswer,
          answerbody: newAnswer,
          useranswered: user.name,
          userid: user._id,
        }
      );

      if (res.data.data) {
        const newObj = {
          answerbody: newAnswer,
          useranswered: user.name,
          userid: user._id,
          answeredon: new Date().toISOString(),
        };

        setQuestion((prev: any) => ({
          ...prev,
          noofanswer: prev.noofanswer + 1,
          answer: [...(prev.answer || []), newObj],
        }));

        setNewAnswer("");
        toast.success("Answer posted");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to post answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= DELETE QUESTION =================
  const handleDeleteQuestion = async () => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

    try {
      const res = await axiosInstance.delete(
        `/question/delete/${question._id}`
      );

      if (res.data.message) {
        toast.success(res.data.message);
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  // ================= DELETE ANSWER =================
  const handleDeleteAnswer = async (id: string) => {
    if (!window.confirm("Delete this answer?")) return;

    try {
      const res = await axiosInstance.delete(
        `/answer/delete/${question._id}`,
        {
          data: {
            noofanswer: question.noofanswer,
            answerid: id,
          },
        }
      );

      if (res.data.data) {
        const updated = question.answer.filter(
          (ans: any) => ans._id !== id
        );

        setQuestion((prev: any) => ({
          ...prev,
          noofanswer: updated.length,
          answer: updated,
        }));

        toast.success("Answer deleted");
      }
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center mt-10 text-gray-500">
        Question not found
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {question.questiontitle}
      </h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          <p className="mb-4">{question.questionbody}</p>

          <div className="flex gap-2 mb-4">
            {question.questiontags?.map((tag: string) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          {question.userid === user?._id && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteQuestion}
            >
              <Trash className="w-4 h-4 mr-1" />
              Delete Question
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ANSWERS */}
      <h2 className="text-xl font-semibold mb-4">
        {question.answer?.length || 0} Answers
      </h2>

      {question.answer?.map((ans: any) => (
        <Card key={ans._id} className="mb-4">
          <CardContent className="p-6">
            <p>{ans.answerbody}</p>

            {ans.userid === user?._id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAnswer(ans._id)}
                className="text-red-600 mt-2"
              >
                Delete
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {/* POST ANSWER */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">
            Your Answer
          </h3>

          <Textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer..."
            className="mb-4"
          />

          <Button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !newAnswer.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Answer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionDetail;
