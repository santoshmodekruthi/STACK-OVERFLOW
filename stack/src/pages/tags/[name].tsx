import { useRouter } from "next/router";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TagPage() {
  const router = useRouter();
  const { name } = router.query;
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;

    fetchQuestionsForTag();
  }, [name]);

  const fetchQuestionsForTag = async () => {
    try {
      const res = await axiosInstance.get("/question/getallquestion");
      const filteredQuestions = res.data.data?.filter((q: any) =>
        q.questiontags?.includes(decodeURIComponent(name as string))
      ) || [];
      setQuestions(filteredQuestions);
    } catch (error) {
      console.log(error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-3xl font-bold">
              Questions tagged with "{decodeURIComponent(name as string)}"
            </h1>
          </div>
          <p className="text-gray-600">
            {questions.length} question{questions.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question) => (
              <Link key={question._id} href={`/questions/${question._id}`}>
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2">
                    {question.questiontitle}
                  </h3>
                  <p className="text-gray-700 mb-3 line-clamp-2">
                    {question.questionbody}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {question.questiontags?.map((tag: string) => (
                      <Badge key={tag} className="bg-blue-100 text-blue-800">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No questions found with this tag
          </div>
        )}
      </div>
    </Mainlayout>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
