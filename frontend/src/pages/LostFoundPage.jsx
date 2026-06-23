import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoAddOutline, IoSearchOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { formatDate, getImageUrl } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

export default function LostFoundPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', location: '', contact: '', type: 'lost' });
  const [image, setImage] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (search) params.append('q', search);
      const { data } = await api.get(`/lost-found?${params}`);
      setItems(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [typeFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Title required');
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => v && fd.append(k, v));
      if (image) fd.append('image', image);
      const { data } = await api.post('/lost-found', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems(prev => [data, ...prev]);
      setCreateOpen(false);
      setFormData({ title: '', description: '', location: '', contact: '', type: 'lost' });
      setImage(null);
      toast.success('Report submitted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setCreating(false); }
  };

  const handleMarkFound = async (id) => {
    try {
      await api.put(`/lost-found/${id}/found`);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
      toast.success('Marked as resolved!');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black gradient-text">Lost & Found</h1>
          <p className="text-white/40 text-sm mt-0.5">Report and find lost items on campus</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><IoAddOutline size={16} /> Report Item</Button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
        </div>
        {['', 'lost', 'found'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${typeFilter === t ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
            {t === '' ? 'All' : t}
          </button>
        ))}
      </div>

      {loading ? <SkeletonList count={3} /> : items.length === 0 ? (
        <EmptyState icon="🔍" title="No items reported" description="Report a lost or found item to help your fellow students!" action={<Button onClick={() => setCreateOpen(true)}>Report Item</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card hover:border-purple-500/20 transition-all ${item.status === 'resolved' ? 'opacity-60' : ''}`}>
              {item.image && (
                <div className="h-36 -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl">
                  <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white">{item.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.type === 'lost' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {item.type}
                  </span>
                  {item.status === 'resolved' && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400">Resolved</span>}
                </div>
              </div>
              {item.description && <p className="text-sm text-white/50 mb-2 line-clamp-2">{item.description}</p>}
              <div className="text-xs text-white/40 space-y-1 mb-3">
                {item.location && <p>📍 {item.location}</p>}
                {item.contact && <p>📞 {item.contact}</p>}
                <p>🕐 {formatDate(item.created_at)}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Avatar src={item.profile_photo} name={item.full_name} size="xs" />
                  <span className="text-xs text-white/40">{item.full_name}</span>
                </div>
                {user?.id === item.user_id && item.status === 'active' && (
                  <button onClick={() => handleMarkFound(item.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors border border-green-500/20">
                    <IoCheckmarkCircleOutline size={13} /> Mark Resolved
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Report Lost/Found Item" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-3">
            {['lost', 'found'].map(t => (
              <button key={t} type="button" onClick={() => setFormData(p => ({ ...p, type: t }))} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${formData.type === t ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                {t === 'lost' ? '😢 Lost' : '🎉 Found'}
              </button>
            ))}
          </div>
          <Input label="Item Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Blue water bottle" />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea className="input-field resize-none" rows={2} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Describe the item..." />
          </div>
          <Input label="Location" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Library, Block A..." />
          <Input label="Contact Info" value={formData.contact} onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} placeholder="Phone or email" />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Photo</label>
            <label className="flex items-center justify-center h-20 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500/50 transition-colors text-white/30 text-xs">
              {image ? image.name : 'Upload item photo'}
              <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0])} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={creating} className="flex-1">Submit Report</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
