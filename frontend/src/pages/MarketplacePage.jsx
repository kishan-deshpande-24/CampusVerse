import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoAddOutline, IoSearchOutline, IoPricetagOutline, IoChatbubbleOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { formatDate, getImageUrl } from '../utils/helpers';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['books', 'calculators', 'gadgets', 'cycle', 'accessories', 'other'];
const CONDITIONS = ['new', 'like_new', 'good', 'fair'];

export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category: 'other', condition: 'good' });
  const [images, setImages] = useState([]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (category) params.append('category', category);
      const { data } = await api.get(`/marketplace?${params}`);
      setItems(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [search, category]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return toast.error('Title and price required');
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => v && fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      const { data } = await api.post('/marketplace', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems(prev => [data, ...prev]);
      setCreateOpen(false);
      setFormData({ title: '', description: '', price: '', category: 'other', condition: 'good' });
      setImages([]);
      toast.success('Listing created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setCreating(false); }
  };

  const handleMarkSold = async (id) => {
    try {
      await api.put(`/marketplace/${id}/sold`);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'sold' } : i));
      toast.success('Marked as sold');
    } catch { toast.error('Failed'); }
  };

  const handleChat = async (sellerId) => {
    try {
      const { data } = await api.post(`/chats/with/${sellerId}`);
      navigate(`/messages?chat=${data.id}`);
    } catch { toast.error('Failed to open chat'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black gradient-text">Marketplace</h1>
          <p className="text-white/40 text-sm mt-0.5">Buy and sell within your campus</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><IoAddOutline size={16} /> Sell Item</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(category === c ? '' : c)} className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${category === c ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonList count={4} /> : items.length === 0 ? (
        <EmptyState icon="🛍️" title="No items found" description="List your first item for sale!" action={<Button onClick={() => setCreateOpen(true)}>Sell Item</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const firstImage = item.images?.split(',')[0];
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card hover:border-purple-500/20 transition-all overflow-hidden">
                {firstImage ? (
                  <div className="h-44 -mx-5 -mt-5 mb-4 overflow-hidden">
                    <img src={getImageUrl(firstImage)} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 -mx-5 -mt-5 mb-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 flex items-center justify-center">
                    <IoPricetagOutline size={36} className="text-white/20" />
                  </div>
                )}
                {item.status === 'sold' && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">SOLD</div>
                )}
                <h3 className="font-bold text-white mb-1 truncate">{item.title}</h3>
                <p className="text-xl font-black gradient-text mb-2">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="tag capitalize text-[10px]">{item.category}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 capitalize">{item.item_condition?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <Avatar src={item.seller_photo} name={item.seller_name} size="xs" />
                  <span className="text-xs text-white/40 flex-1 truncate">{item.seller_name}</span>
                  {item.status === 'available' && (
                    <button onClick={() => handleChat(item.seller_id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-500/20">
                      <IoChatbubbleOutline size={12} /> Chat
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="List Item for Sale" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="CLRS Textbook 3rd Edition" />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea className="input-field resize-none" rows={2} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Condition, details..." />
          </div>
          <Input label="Price (₹) *" type="number" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} placeholder="350" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-dark-700 capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Condition</label>
              <select className="input-field" value={formData.condition} onChange={e => setFormData(p => ({ ...p, condition: e.target.value }))}>
                {CONDITIONS.map(c => <option key={c} value={c} className="bg-dark-700 capitalize">{c.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Images (up to 5)</label>
            <label className="flex items-center justify-center h-20 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500/50 transition-colors text-white/30 text-xs">
              {images.length > 0 ? `${images.length} image(s) selected` : 'Click to upload images'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => setImages(Array.from(e.target.files).slice(0, 5))} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={creating} className="flex-1">List Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
