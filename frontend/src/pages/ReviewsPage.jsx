import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoStarOutline, IoStar, IoAddOutline, IoSearchOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { formatDate } from '../utils/helpers';
import api from '../api/axios';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Science', 'Other'];

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => !readonly && onChange?.(s)} className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
          {s <= value ? <IoStar size={readonly ? 14 : 20} className="text-yellow-400" /> : <IoStarOutline size={readonly ? 14 : 20} className="text-white/30" />}
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [formData, setFormData] = useState({ faculty_name: '', subject: '', department: '', content: '' });
  const [rating, setRating] = useState(0);
  const [teachingRating, setTeachingRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (deptFilter) params.append('department', deptFilter);
      const { data } = await api.get(`/reviews?${params}`);
      setReviews(data.reviews);
      setStats(data.stats);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [search, deptFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.faculty_name || !rating) return toast.error('Faculty name and rating required');
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', { ...formData, rating, teaching_rating: teachingRating });
      setReviews(prev => [data, ...prev]);
      setAddOpen(false);
      setFormData({ faculty_name: '', subject: '', department: '', content: '' });
      setRating(0); setTeachingRating(0);
      toast.success('Review submitted anonymously!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black gradient-text">Faculty Reviews</h1>
          <p className="text-white/40 text-sm mt-0.5">Anonymous faculty ratings and reviews</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><IoAddOutline size={16} /> Add Review</Button>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {stats.slice(0, 6).map(s => (
            <div key={s.faculty_name} className="glass rounded-xl p-4 border border-white/10">
              <p className="font-bold text-white text-sm truncate">{s.faculty_name}</p>
              <p className="text-xs text-white/40 mb-2">{s.department}</p>
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(s.avg_rating)} readonly />
                <span className="text-sm font-bold text-yellow-400">{parseFloat(s.avg_rating).toFixed(1)}</span>
                <span className="text-xs text-white/30">({s.review_count})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-purple-500">
          <option value="" className="bg-dark-700">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-dark-700">{d}</option>)}
        </select>
      </div>

      {loading ? <SkeletonList count={3} /> : reviews.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews yet" description="Be the first to review a faculty member anonymously!" action={<Button onClick={() => setAddOpen(true)}>Add Review</Button>} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card hover:border-purple-500/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{review.faculty_name}</h3>
                  <p className="text-xs text-white/40">{review.subject && `${review.subject} · `}{review.department}</p>
                </div>
                <div className="text-right">
                  <StarRating value={review.rating} readonly />
                  <p className="text-xs text-white/30 mt-1">{formatDate(review.created_at)}</p>
                </div>
              </div>
              {review.content && <p className="text-sm text-white/70 leading-relaxed">{review.content}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs text-white/60">A</div>
                <span className="text-xs text-white/40">Anonymous Student</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Anonymous Review" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass rounded-xl p-3 border border-yellow-500/20 bg-yellow-500/5">
            <p className="text-xs text-yellow-400">🔒 Your identity is completely anonymous. Reviews cannot be traced back to you.</p>
          </div>
          <Input label="Faculty Name *" value={formData.faculty_name} onChange={e => setFormData(p => ({ ...p, faculty_name: e.target.value }))} placeholder="Prof. John Smith" />
          <Input label="Subject" value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} placeholder="Data Structures" />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Department</label>
            <select className="input-field" value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}>
              <option value="" className="bg-dark-700">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-dark-700">{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Overall Rating *</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Teaching Quality</label>
            <StarRating value={teachingRating} onChange={setTeachingRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Review</label>
            <textarea className="input-field resize-none" rows={3} value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} placeholder="Share your experience..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Submit Anonymously</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
