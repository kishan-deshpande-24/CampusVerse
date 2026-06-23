import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IoCalendarOutline, IoLocationOutline, IoPeopleOutline, IoAddOutline,
  IoDocumentOutline, IoDownloadOutline, IoNotificationsOutline, IoNotificationsOffOutline, IoTrashOutline, IoLinkOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { formatDate } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

const CATEGORIES = ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'hackathon', 'general'];

function CountdownTimer({ eventDate }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(eventDate) - new Date();
      if (diff <= 0) { setTime('Event started'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTime(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [eventDate]);
  return <span className="text-xs text-purple-400 font-medium">⏱ {time}</span>;
}

export default function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [upcoming, setUpcoming] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'general', location: '', event_date: '', registration_deadline: '', max_attendees: '', registration_form_link: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append('category', filter);
      if (upcoming) params.append('upcoming', 'true');
      const { data } = await api.get(`/events?${params}`);
      setEvents(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [filter, upcoming]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) return toast.error('Title and date required');
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => v && fd.append(k, v));
      if (pdfFile) fd.append('pdf_file', pdfFile);
      const { data } = await api.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEvents(prev => [data, ...prev]);
      setCreateOpen(false);
      setFormData({ title: '', description: '', category: 'general', location: '', event_date: '', registration_deadline: '', max_attendees: '', registration_form_link: '' });
      setPdfFile(null);
      toast.success('Event created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setCreating(false); }
  };

  const handleRegister = async (eventId, status) => {
    try {
      const { data } = await api.post(`/events/${eventId}/register`, { status });
      setEvents(prev => prev.map(e => e.id === eventId ? {
        ...e,
        user_status: data.status,
        attendees_count: data.status ? e.attendees_count + 1 : Math.max(0, e.attendees_count - 1)
      } : e));
      toast.success(data.status ? `Marked as ${data.status}!` : 'Removed');
    } catch { toast.error('Failed'); }
  };

  const handleReminder = async (eventId) => {
    try {
      const { data } = await api.post(`/events/${eventId}/reminder`);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, reminder_set: data.reminder_set } : e));
      toast.success(data.message);
    } catch { toast.error('Failed to set reminder'); }
  };

  const handleDownload = async (eventId, title) => {
    try {
      const res = await api.get(`/events/${eventId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download PDF'); }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('Event deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black gradient-text">Event Hub</h1>
          <p className="text-white/40 text-sm mt-0.5">Discover and join campus events</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><IoAddOutline size={16} /> Create Event</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setUpcoming(!upcoming)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${upcoming ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}>
          {upcoming ? '📅 Upcoming' : '📋 All Events'}
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(filter === c ? '' : c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === c ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? <SkeletonList count={3} /> : events.length === 0 ? (
        <EmptyState icon="🎉" title="No events found" description="Create the first event for your campus!" action={<Button onClick={() => setCreateOpen(true)}>Create Event</Button>} />
      ) : (
        <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass border border-white/10 rounded-2xl p-5 hover:border-purple-500/20 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full capitalize">{event.category}</span>
                    <CountdownTimer eventDate={event.event_date} />
                    {event.pdf_file && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-full">
                        <IoDocumentOutline size={11} /> PDF
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{event.title}</h3>
                  {event.description && <p className="text-sm text-white/50 mt-1 line-clamp-2">{event.description}</p>}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/40">
                    <span className="flex items-center gap-1.5"><IoCalendarOutline size={13} />{new Date(event.event_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {event.location && <span className="flex items-center gap-1.5"><IoLocationOutline size={13} />{event.location}</span>}
                    <span className="flex items-center gap-1.5"><IoPeopleOutline size={13} />{event.attendees_count} going</span>
                    <span className="text-white/30">by {event.creator_name}</span>
                  </div>
                  {event.registration_form_link && (
                    <a
                      href={event.registration_form_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-lg hover:bg-purple-500/30 transition-colors"
                    >
                      <IoLinkOutline size={13} /> Register via Form
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRegister(event.id, event.user_status === 'going' ? 'none' : 'going')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${event.user_status === 'going' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-green-500/10 hover:text-green-400'}`}
                  >
                    {event.user_status === 'going' ? '✓ Going' : 'Going'}
                  </button>
                  <button
                    onClick={() => handleRegister(event.id, event.user_status === 'interested' ? 'none' : 'interested')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${event.user_status === 'interested' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400'}`}
                  >
                    {event.user_status === 'interested' ? '★ Interested' : 'Interested'}
                  </button>
                  <button
                    onClick={() => handleReminder(event.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${event.reminder_set ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-blue-500/10 hover:text-blue-400'}`}
                  >
                    {event.reminder_set ? <><IoNotificationsOffOutline size={13} /> Reminded</> : <><IoNotificationsOutline size={13} /> Remind Me</>}
                  </button>
                  {event.pdf_file && (
                    <button
                      onClick={() => handleDownload(event.id, event.title)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-white/60 border border-white/10 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center gap-1.5"
                    >
                      <IoDownloadOutline size={13} /> Download PDF
                    </button>
                  )}
                  {(event.creator_id === user?.id || user?.role === 'admin') && (
                    <button onClick={() => handleDelete(event.id)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-red-400/60 border border-white/10 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center gap-1.5">
                      <IoTrashOutline size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Event" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Event Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Annual Tech Fest 2024" />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea className="input-field resize-none" rows={3} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Event details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-dark-700 capitalize">{c}</option>)}
              </select>
            </div>
            <Input label="Location" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Main Auditorium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Event Date & Time *</label>
              <input type="datetime-local" className="input-field" value={formData.event_date} onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))} />
            </div>
            <Input label="Max Attendees" type="number" value={formData.max_attendees} onChange={e => setFormData(p => ({ ...p, max_attendees: e.target.value }))} placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Registration Deadline</label>
            <input type="datetime-local" className="input-field" value={formData.registration_deadline} onChange={e => setFormData(p => ({ ...p, registration_deadline: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Registration Form Link <span className="text-white/30 text-xs">(optional — Google Form, Typeform, etc.)</span></label>
            <div className="relative">
              <IoLinkOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
              <input
                type="url"
                className="input-field pl-10"
                placeholder="https://forms.google.com/..."
                value={formData.registration_form_link}
                onChange={e => setFormData(p => ({ ...p, registration_form_link: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Event PDF <span className="text-white/30 text-xs">(optional)</span></label>
            <label className={`flex items-center gap-3 h-14 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${pdfFile ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-purple-500/50'}`}>
              <IoDocumentOutline size={20} className={pdfFile ? 'text-red-400' : 'text-white/30'} />
              <span className={`text-sm ${pdfFile ? 'text-red-300' : 'text-white/30'}`}>{pdfFile ? pdfFile.name : 'Upload event PDF (brochure, schedule...)'}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files[0])} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={creating} className="flex-1">Create Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
