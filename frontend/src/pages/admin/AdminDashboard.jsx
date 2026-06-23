import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoPeopleOutline, IoDocumentTextOutline, IoCalendarOutline, IoFlagOutline, IoStorefrontOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-white/10">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={22} className="text-white" />
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-sm text-white/40 mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  const { stats, recentUsers, recentPosts } = data;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black gradient-text">Admin Dashboard</h1>
        <p className="text-white/40 text-sm mt-0.5">Overview of CampusVerse platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={IoPeopleOutline} label="Total Users" value={stats.users} color="bg-purple-600" />
        <StatCard icon={IoDocumentTextOutline} label="Pending Approvals" value={stats.pending} color="bg-yellow-600" />
        <StatCard icon={IoCheckmarkCircleOutline} label="Approved Users" value={stats.approved} color="bg-green-600" />
        <StatCard icon={IoDocumentTextOutline} label="Total Posts" value={stats.posts} color="bg-blue-600" />
        <StatCard icon={IoDocumentTextOutline} label="Notes Shared" value={stats.notes} color="bg-indigo-600" />
        <StatCard icon={IoCalendarOutline} label="Events" value={stats.events} color="bg-pink-600" />
        <StatCard icon={IoFlagOutline} label="Pending Reports" value={stats.reports} color="bg-red-600" />
        <StatCard icon={IoStorefrontOutline} label="Marketplace Items" value={stats.marketplace} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 border border-white/10">
          <h2 className="font-bold text-white mb-4">Recent Registrations</h2>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{u.full_name}</p>
                  <p className="text-xs text-white/40">@{u.username} · {u.department}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  u.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                  u.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>{u.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/10">
          <h2 className="font-bold text-white mb-4">Recent Posts</h2>
          <div className="space-y-3">
            {recentPosts.map(p => (
              <div key={p.id} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-sm text-white/80 line-clamp-2">{p.content || '[Image post]'}</p>
                <p className="text-xs text-white/30 mt-1">@{p.username} · {formatDate(p.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
