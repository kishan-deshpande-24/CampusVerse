import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMenuOutline, IoSearchOutline, IoNotificationsOutline, IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import api from '../../api/axios';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); setShowResults(false); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${search}`);
        setResults(data);
        setShowResults(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors">
        <IoMenuOutline size={22} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => results.length && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search students, posts..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all"
        />
        {search && (
          <button onClick={() => { setSearch(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
            <IoClose size={14} />
          </button>
        )}
        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 w-full glass rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
            >
              {results.map(u => (
                <button
                  key={u.id}
                  onClick={() => { navigate(`/profile/${u.username}`); setSearch(''); setShowResults(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <Avatar src={u.profile_photo} name={u.full_name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-white">{u.full_name}</p>
                    <p className="text-xs text-white/40">@{u.username} · {u.department}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button onClick={() => navigate('/notifications')} className="relative p-2.5 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors">
          <IoNotificationsOutline size={20} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button onClick={() => navigate(`/profile/${user?.username}`)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors">
          <Avatar src={user?.profile_photo} name={user?.full_name} size="sm" />
        </button>
      </div>
    </header>
  );
}
