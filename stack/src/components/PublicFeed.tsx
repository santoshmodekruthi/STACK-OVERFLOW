import React, { useState, useEffect } from 'react';
import { Image, Video, Send } from 'lucide-react';
// @ts-ignore
import axiosInstance from '../../lib/axiosinstance';
import PostCard from './PostCard';

interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  caption: string;
  images: string[];
  videos: string[];
  likes: Array<{ _id: string; name?: string }>;
  comments: Array<{
    _id: string;
    commentBy: { _id: string; name: string; avatar?: string };
    commentText: string;
    createdAt: string;
  }>;
  shares: number;
  createdAt: string;
}

interface PublicFeedProps {
  currentUserId: string;
}

const PublicFeed = ({ currentUserId }: PublicFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const [postLimitMessage, setPostLimitMessage] = useState('');

  useEffect(() => {
    fetchPublicFeed();
    checkPostLimit();
  }, []);

  const fetchPublicFeed = async () => {
    try {
      const response = await axiosInstance.get('/post/feed');
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
  };

  const checkPostLimit = async () => {
    try {
      const response = await axiosInstance.get('/user/check-post-limit');
      if (!response.data.canPost) {
        setCanPost(false);
        setPostLimitMessage(response.data.message);
      }
    } catch (error) {
      console.log('Note: Post limit check not critical');
    }
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPostCaption.trim() && selectedImages.length === 0 && selectedVideos.length === 0) {
      alert('Please add some content to your post');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('caption', newPostCaption);

      selectedImages.forEach((img: File) => {
        formData.append('images', img);
      });

      selectedVideos.forEach((vid: File) => {
        formData.append('videos', vid);
      });

      const response = await axiosInstance.post('/post/create', {
        caption: newPostCaption,
        images: selectedImages.map((img: File) => URL.createObjectURL(img)),
        videos: selectedVideos.map((vid: File) => URL.createObjectURL(vid)),
      });

      setPosts([response.data.post, ...posts]);
      setNewPostCaption('');
      setSelectedImages([]);
      setSelectedVideos([]);
      setPostLimitMessage('');
      checkPostLimit();
    } catch (error: unknown) {
      console.error('Error creating post:', error);
      const axiosError = error as any;
      setPostLimitMessage(axiosError.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const response = await axiosInstance.post(`/post/${postId}/like`);
      // Update post likes in local state
      setPosts(
        posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: post.likes.some((like) => like._id === currentUserId)
                  ? post.likes.filter((like) => like._id !== currentUserId)
                  : [...post.likes, { _id: currentUserId }],
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentPost = async (postId: string, commentText: string) => {
    try {
      const response = await axiosInstance.post(`/post/${postId}/comment`, {
        commentText,
      });
      setPosts(
        posts.map((post: Post) =>
          post._id === postId
            ? { ...post, comments: response.data.comments }
            : post
        )
      );
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await axiosInstance.delete(`/post/${postId}`);
      setPosts(posts.filter((post: Post) => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      await axiosInstance.post(`/post/${postId}/share`);
      setPostLimitMessage('Post shared successfully!');
      setTimeout(() => setPostLimitMessage(''), 3000);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Create Post Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Create a Post</h2>

        {!canPost && postLimitMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {postLimitMessage}
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea
            value={newPostCaption}
            onChange={(e) => setNewPostCaption(e.target.value)}
            placeholder="What's on your mind? Share something with the community..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            disabled={!canPost || loading}
          />

          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition">
              <Image size={20} />
              <span>Add Image</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedImages(Array.from(e.target.files || []))}
                className="hidden"
                disabled={!canPost || loading}
              />
            </label>

            <label className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-200 transition">
              <Video size={20} />
              <span>Add Video</span>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedVideos(Array.from(e.target.files || []))}
                className="hidden"
                disabled={!canPost || loading}
              />
            </label>
          </div>

          {selectedImages.length > 0 && (
            <p className="text-sm text-gray-600">{selectedImages.length} image(s) selected</p>
          )}
          {selectedVideos.length > 0 && (
            <p className="text-sm text-gray-600">{selectedVideos.length} video(s) selected</p>
          )}

          <button
            type="submit"
            disabled={!canPost || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send size={20} />
            {loading ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>

      {/* Posts Feed */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Community Feed</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLikePost}
              onComment={handleCommentPost}
              onDelete={handleDeletePost}
              onShare={handleSharePost}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PublicFeed;
