import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Post = {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: string[];
  shareCount: number;
  comments: {
    _id: string;
    userId: string;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
};

const PublicSpacePage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const fetchPosts = async () => {
    try {
      const res = await axiosInstance.get("/public");
      setPosts(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load public space");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please login to post");
      return;
    }
    if (!content.trim() && !imageUrl.trim() && !videoUrl.trim()) {
      toast.error("Add some text, image URL, or video URL");
      return;
    }
    setLoading(true);
    try {
      const tokenUser = JSON.parse(localStorage.getItem("user") || "null");
      const token = tokenUser?.token;
      const res = await axiosInstance.post(
        "/public",
        { content, imageUrl, videoUrl },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      if (res.data.data) {
        toast.success("Posted to public space");
        setContent("");
        setImageUrl("");
        setVideoUrl("");
        fetchPosts();
      }
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message || "Failed to create post. Check limits.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast.info("Please login to like posts");
      return;
    }
    try {
      const tokenUser = JSON.parse(localStorage.getItem("user") || "null");
      const token = tokenUser?.token;
      await axiosInstance.post(
        `/public/${postId}/like`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update like");
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!user) {
      toast.info("Please login to comment");
      return;
    }
    if (!text) {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      const tokenUser = JSON.parse(localStorage.getItem("user") || "null");
      const token = tokenUser?.token;
      await axiosInstance.post(
        `/public/${postId}/comment`,
        { text },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await axiosInstance.post(`/public/${postId}/share`);
      toast.info("Post share count updated");
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to share post");
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Public Space</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <Textarea
                placeholder="Share something with everyone..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Input
                  placeholder="Video URL (YouTube, etc.)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Posting..." : "Post"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked =
              user &&
              post.likes.some((id) => String(id) === String(user._id));
            return (
              <Card key={post._id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {post.userId?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {post.userId?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {post.content && (
                    <p className="text-sm text-gray-800 whitespace-pre-line">
                      {post.content}
                    </p>
                  )}
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="max-h-80 w-full object-cover rounded"
                    />
                  )}
                  {post.videoUrl && (
                    <a
                      href={post.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      View attached video
                    </a>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post._id)}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{isLiked ? "Unlike" : "Like"}</span>
                      <span>({post.likes.length})</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length} comments</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShare(post._id)}
                      className="flex items-center gap-1 hover:text-green-600"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                      <span>({post.shareCount})</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {post.comments.map((c) => (
                      <div
                        key={c._id}
                        className="text-sm bg-gray-50 rounded px-2 py-1"
                      >
                        <span className="font-semibold mr-1">
                          {c.userId}
                        </span>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a comment"
                      value={commentTexts[post._id] || ""}
                      onChange={(e) =>
                        setCommentTexts((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddComment(post._id)}
                    >
                      Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {posts.length === 0 && (
            <div className="text-center text-gray-500 text-sm">
              No posts yet. Be the first to share something.
            </div>
          )}
        </div>
      </div>
    </Mainlayout>
  );
};

export default PublicSpacePage;

