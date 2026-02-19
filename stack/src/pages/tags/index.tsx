import Mainlayout from "@/layout/Mainlayout";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { Search } from "lucide-react";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredTags(
        tags.filter((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredTags(tags);
    }
  }, [searchQuery, tags]);

  const fetchTags = async () => {
    try {
      const res = await axiosInstance.get("/question/getallquestion");
      const allTags = new Set<string>();
      
      res.data.data?.forEach((question: any) => {
        question.questiontags?.forEach((tag: string) => {
          allTags.add(tag);
        });
      });
      
      setTags(Array.from(allTags).sort());
    } catch (error) {
      console.log(error);
      // Set some default tags for demo
      setTags(["javascript", "react", "node.js", "typescript", "python", "mongodb"]);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tags</h1>
          <p className="text-gray-600 mb-6">
            A tag is a label that categorizes your question with other similar questions.
          </p>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`}>
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                  <Badge className="bg-blue-100 text-blue-800 mb-2">
                    {tag}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Click to view questions tagged with "{tag}"
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No tags found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </Mainlayout>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
