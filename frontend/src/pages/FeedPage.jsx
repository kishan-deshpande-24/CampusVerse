import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import { SkeletonList } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import api from '../api/axios';

const TYPES = ['all', 'text', 'question', 'announcement', 'confession'];

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (p = 1, type = activeType, reset = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 10 });
      if (type !== 'all') params.append('type', type);
      const { data } = await api.get(`/posts/feed?${params}`);
      setPosts(prev => reset || p === 1 ? data.posts : [...prev, ...data.posts]);
      setHasMore(p < data.pages);
      setPage(p);
    } catch {} finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeType]);

  useEffect(() => { fetchPosts(1, activeType, true); }, [activeType]);

  const handleTypeChange = (type) => {
    setActiveType(type);
    setPage(1);
  };

  const handlePostCreated = (post) => setPosts(prev => [post, ...prev]);
  const handlePostDeleted = (id) => setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              activeType === t
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            {t === 'all' ? '✨ All' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : posts.length === 0 ? (
        <EmptyState icon="📝" title="No posts yet" description="Be the first to share something with your campus!" />
      ) : (
        <>
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
          ))}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={() => fetchPosts(page + 1)}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
