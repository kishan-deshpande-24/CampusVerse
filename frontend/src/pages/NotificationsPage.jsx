import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';
import Avatar from '../components/ui/Avatar';
import { formatDate } from '../utils/helpers';
import api from '../api/axios';

const TYPE_ICONS = {
  like: '❤️', comment: '💬', follow: '👤', team_request: '👥',
  team_accepted: '✅', event: '📅', default: '🔔'
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data)).finally(() => setLoading(false));
    api.put('/notifications/read').catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black gradient-text">Notifications</h1>
        <button onClick={() => api.put('/notifications/read').then(() => setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 }))))} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
          <IoCheckmarkDoneOutline size={15} /> Mark all read
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="flex gap-3 p-4 glass rounded-xl animate-pulse"><div className="w-11 h-11 rounded-full bg-white/10" /><div className="flex-1"><div className="h-3 bg-white/10 rounded w-3/4 mb-2" /><div className="h-3 bg-white/10 rounded w-1/2" /></div></div>)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-white/40">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${n.is_read ? 'glass border-white/5' : 'bg-purple-500/5 border-purple-500/20'}`}
            >
              <div className="relative">
                <Avatar src={n.from_photo} name={n.from_name} size="md" />
                <span className="absolute -bottom-1 -right-1 text-base">{TYPE_ICONS[n.type] || TYPE_ICONS.default}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{n.message}</p>
                <p className="text-xs text-white/30 mt-0.5">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
