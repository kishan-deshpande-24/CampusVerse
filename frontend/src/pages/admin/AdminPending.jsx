import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoCheckmarkOutline, IoCloseOutline, IoEyeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatDate, getImageUrl } from '../../utils/helpers';
import api from '../../api/axios';

export default function AdminPending() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    api.get('/admin/users/pending').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/users/${id}/approve`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User approved! Email sent.');
    } catch { toast.error('Failed'); } finally { setProcessing(null); }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/users/${id}/reject`, { reason: rejectReason });
      setUsers(prev => prev.filter(u => u.id !== id));
      setRejectOpen(null);
      setRejectReason('');
      toast.success('User rejected. Email sent.');
    } catch { toast.error('Failed'); } finally { setProcessing(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black gradient-text">Pending Approvals</h1>
        <p className="text-white/40 text-sm mt-0.5">{users.length} students waiting for approval</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-white/40">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-5 border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-white">{user.full_name}</h3>
                    {!user.email_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Email not verified</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-white/50">
                    <p>@{user.username}</p>
                    <p>{user.email}</p>
                    <p>USN: {user.usn}</p>
                    <p>{user.department} · Year {user.year}{user.section ? ` · Sec ${user.section}` : ''}</p>
                    <p>Registered: {formatDate(user.created_at)}</p>
                  </div>
                </div>

                {user.id_card_image && (
                  <button onClick={() => setSelectedUser(user)} className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-colors">
                    <img src={getImageUrl(user.id_card_image)} alt="ID Card" className="w-full h-full object-cover" />
                  </button>
                )}
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleApprove(user.id)}
                  loading={processing === user.id}
                  className="flex-1"
                >
                  <IoCheckmarkOutline size={15} /> Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRejectOpen(user.id)}
                  className="flex-1"
                >
                  <IoCloseOutline size={15} /> Reject
                </Button>
                {user.id_card_image && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                    <IoEyeOutline size={15} /> View ID
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View ID Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title={`ID Card — ${selectedUser?.full_name}`} size="md">
        {selectedUser?.id_card_image && (
          <div>
            <img src={getImageUrl(selectedUser.id_card_image)} alt="ID Card" className="w-full rounded-xl mb-4" />
            <div className="flex gap-3">
              <Button variant="success" onClick={() => { handleApprove(selectedUser.id); setSelectedUser(null); }} className="flex-1">
                <IoCheckmarkOutline size={15} /> Approve
              </Button>
              <Button variant="danger" onClick={() => { setRejectOpen(selectedUser.id); setSelectedUser(null); }} className="flex-1">
                <IoCloseOutline size={15} /> Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectOpen} onClose={() => setRejectOpen(null)} title="Reject Application" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-white/60">Provide a reason for rejection (optional). This will be sent to the student via email.</p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="e.g. ID card image is unclear, please re-register with a clearer photo."
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setRejectOpen(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => handleReject(rejectOpen)} loading={processing === rejectOpen} className="flex-1">Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
