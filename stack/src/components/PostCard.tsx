import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, User } from 'lucide-react';

interface Like {
  _id: string;
  name?: string;
}

interface Author {
  _id: string;
  name: string;
  avatar?: string;
  points?: number;
}

interface Comment {
  _id: string;
  commentBy: Author;
  commentText: string;
  createdAt: string;
}

interface PostCardProps {
  post: {
    _id: string;
    author: Author;
    caption: string;
    images: string[];
    videos: string[];
    likes: Like[];
    comments: Comment[];
    shares: number;
    createdAt: string;
  };
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onDelete: (postId: string) => void;
  onShare: (postId: string) => void;
  currentUserId: string;
}

const PostCard = ({ post, onLike, onComment, onDelete, onShare, currentUserId }: PostCardProps) => {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const isAuthor = post.author._id === currentUserId;
  const isLiked = post.likes.some(like => like._id === currentUserId);

  const handleLike = () => {
    onLike(post._id);
  };

  const handleComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post._id, commentText);
      setCommentText('');
      setShowCommentForm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={post.author.avatar || 'https://via.placeholder.com/40'}
            alt={post.author.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold">{post.author.name}</h3>
            <p className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {post.author.points} pts
          </span>
        </div>
        {isAuthor && (
          <button
            onClick={() => onDelete(post._id)}
            className="text-red-500 hover:text-red-700 p-2"
            title="Delete post"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Post Content */}
      <p className="text-gray-800 mb-4">{post.caption}</p>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {post.images.map((img: string, idx: number) => (
            <img
              key={idx}
              src={img}
              alt={`post-${idx}`}
              className="rounded-md max-h-64 object-cover w-full"
            />
          ))}
        </div>
      )}

      {/* Post Videos */}
      {post.videos && post.videos.length > 0 && (
        <div className="mb-4 space-y-2">
          {post.videos.map((vid: string, idx: number) => (
            <video
              key={idx}
              controls
              className="w-full rounded-md max-h-64"
            >
              <source src={vid} />
            </video>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center gap-6 border-t border-b border-gray-200 py-3 mb-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 hover:text-red-500 transition ${
            isLiked ? 'text-red-500' : 'text-gray-600'
          }`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{post.likes.length}</span>
        </button>

        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition"
        >
          <MessageCircle size={20} />
          <span>{post.comments.length}</span>
        </button>

        <button
          onClick={() => onShare(post._id)}
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition"
        >
          <Share2 size={20} />
          <span>{post.shares}</span>
        </button>
      </div>

      {/* Comments Section */}
      {post.comments.length > 0 && (
        <div className="mb-4 space-y-3">
          <h4 className="font-semibold text-sm">Comments</h4>
          {post.comments.map((comment: Comment, idx: number) => (
            <div key={idx} className="flex gap-3 bg-gray-50 p-3 rounded">
              <img
                src={comment.commentBy.avatar || 'https://via.placeholder.com/32'}
                alt={comment.commentBy.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">{comment.commentBy.name}</p>
                <p className="text-sm text-gray-700">{comment.commentText}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Form */}
      {showCommentForm && (
        <form onSubmit={handleComment} className="mt-4 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Post
          </button>
        </form>
      )}
    </div>
  );
};

export default PostCard;
