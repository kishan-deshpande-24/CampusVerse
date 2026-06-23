import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoSearchOutline, IoBanOutline, IoCheckmarkOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/helpers';
import api from '../../api/axios';

const STATUS_COLORS = {
  approved: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  banned: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, statusFilter]);

  const handleBan = async (id) => {
    if (!confirm('Ban this user?')) return;
    setProcessing(id);
    try {
      await api.put(`/admin/users/${id}/ban`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'banned' } : u));
      toast.success('User banned');
    } catch { toast.error('Failed'); } finally { setProcessing(null); }
  };

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/users/${id}/approve`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u));
      toast.success('User approved');
    } catch { toast.error('Failed'); } finally { setProcessing(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black gradient-text">All Users</h1>
        <p className="text-white/40 text-sm mt-0.5">{users.length} users found</p>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-purple-500">
          <option value="" className="bg-dark-700">All Status</option>
          {['approved', 'pending', 'rejected', 'banned'].map(s => <option key={s} value={s} className="bg-dark-700 capitalize">{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Department</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{user.full_name}</p>
                      <p className="text-xs text-white/40">@{user.username} · {user.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-sm text-white/60">{user.department}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_COLORS[user.status]}`}>{user.status}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-xs text-white/40">{formatDate(user.created_at)}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'pending' && (
                        <button onClick={() => handleApprove(user.id)} disabled={processing === user.id} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                          <IoCheckmarkOutline size={14} />
                        </button>
                      )}
                      {user.status !== 'banned' && (
                        <button onClick={() => handleBan(user.id)} disabled={processing === user.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <IoBanOutline size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="text-center py-12 text-white/30">No users found</div>}
        </div>
      )}
    </div>
  );
}
