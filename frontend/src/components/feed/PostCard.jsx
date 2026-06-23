import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareOutline,
  IoBookmarkOutline, IoBookmark, IoEllipsisHorizontal, IoTrashOutline,
  IoFlagOutline, IoEyeOffOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';
import { formatDate, getImageUrl } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

const TYPE_COLORS = {
  confession: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  question: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  announcement: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  text: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
};

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(!!post.is_liked);
  const [likesCount, setLikesCount] = useState(parseInt(post.likes_count) || 0);
  const [bookmarked, setBookmarked] = useState(!!post.is_bookmarked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(parseInt(post.comments_count) || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async () => {
    try {
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      await api.post(`/posts/${post.id}/like`);
    } catch { setLiked(liked); setLikesCount(likesCount); }
  };

  const handleBookmark = async () => {
    try {
      setBookmarked(!bookmarked);
      await api.post(`/posts/${post.id}/bookmark`);
      toast.success(bookmarked ? 'Removed from bookmarks' : 'Bookmarked!');
    } catch { setBookmarked(bookmarked); }
  };

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/posts/${post.id}/comments`);
      setComments(data);
      setShowComments(true);
    } catch {} finally { setLoadingComments(false); }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content: commentText });
      setComments([...comments, data]);
      setCommentsCount(commentsCount + 1);
      setCommentText('');
    } catch (err) { toast.error('Failed to comment'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleReport = async () => {
    try {
      await api.post(`/posts/${post.id}/report`, { reason: 'Inappropriate content' });
      toast.success('Post reported');
    } catch { toast.error('Failed to report'); }
    setShowMenu(false);
  };

  const isOwner = user?.id === post.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-4 hover:border-white/10 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {post.is_anonymous ? (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <IoEyeOffOutline size={18} className="text-white/60" />
            </div>
          ) : (
            <button onClick={() => post.author_username && navigate(`/profile/${post.author_username}`)}>
              <Avatar src={post.author_photo} name={post.author_name} size="md" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {post.is_anonymous ? 'Anonymous' : post.author_name}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${TYPE_COLORS[post.type] || TYPE_COLORS.text}`}>
                {post.type}
              </span>
            </div>
            <p className="text-xs text-white/40">{formatDate(post.created_at)}</p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <IoEllipsisHorizontal size={18} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                className="absolute right-0 top-8 w-40 glass rounded-xl border border-white/10 shadow-xl z-10 overflow-hidden"
              >
                {isOwner && (
                  <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <IoTrashOutline size={15} /> Delete
                  </button>
                )}
                {!isOwner && (
                  <button onClick={handleReport} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 transition-colors">
                    <IoFlagOutline size={15} /> Report
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      {post.content && <p className="text-white/90 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>}
      {post.image && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img src={getImageUrl(post.image)} alt="post" className="w-full max-h-96 object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-white/5">
        <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${liked ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
          {liked ? <IoHeart size={17} /> : <IoHeartOutline size={17} />}
          <span>{likesCount}</span>
        </button>
        <button onClick={loadComments} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showComments ? 'text-blue-400 bg-blue-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
          <IoChatbubbleOutline size={17} />
          <span>{commentsCount}</span>
        </button>
        <button onClick={handleBookmark} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ml-auto ${bookmarked ? 'text-yellow-400 bg-yellow-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
          {bookmarked ? <IoBookmark size={17} /> : <IoBookmarkOutline size={17} />}
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-white/5 space-y-3"
          >
            {comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <Avatar src={c.profile_photo} name={c.full_name} size="xs" />
                <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-white/80">{c.full_name}</p>
                  <p className="text-xs text-white/60 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            <form onSubmit={submitComment} className="flex gap-2">
              <Avatar src={user?.profile_photo} name={user?.full_name} size="xs" />
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
              <button type="submit" className="px-3 py-2 bg-purple-600 rounded-xl text-white text-xs font-medium hover:bg-purple-500 transition-colors">
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
