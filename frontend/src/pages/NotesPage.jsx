import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUploadOutline, IoDownloadOutline, IoHeartOutline, IoHeart, IoSearchOutline, IoDocumentOutline, IoFilterOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { formatDate, formatFileSize, getImageUrl } from '../utils/helpers';
import api from '../api/axios';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Data Structures', 'Algorithms', 'DBMS', 'OS', 'Networks', 'Machine Learning', 'Web Development', 'Other'];
const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Science', 'Other'];

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ subject: '', semester: '', department: '' });
  const [uploadData, setUploadData] = useState({ title: '', description: '', subject: '', semester: '', department: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.department) params.append('department', filters.department);
      const { data } = await api.get(`/notes?${params}`);
      setNotes(data.notes);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, [search, filters]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Select a file');
    if (!uploadData.title || !uploadData.subject) return toast.error('Title and subject required');
    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries(uploadData).forEach(([k, v]) => v && fd.append(k, v));
      fd.append('file', file);
      const { data } = await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNotes(prev => [data, ...prev]);
      setUploadOpen(false);
      setFile(null);
      setUploadData({ title: '', description: '', subject: '', semester: '', department: '' });
      toast.success('Note uploaded!');
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); } finally { setUploading(false); }
  };

  const handleLike = async (noteId) => {
    try {
      await api.post(`/notes/${noteId}/like`);
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, likes_count: n.is_liked ? n.likes_count - 1 : n.likes_count + 1, is_liked: !n.is_liked } : n));
    } catch {}
  };

  const handleDownload = (note) => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${note.file_path}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black gradient-text">Notes Library</h1>
          <p className="text-white/40 text-sm mt-0.5">Share and discover study materials</p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <IoCloudUploadOutline size={16} /> Upload Note
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-2xl p-4 mb-5 border border-white/10">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
          </div>
          <select value={filters.subject} onChange={e => setFilters(p => ({ ...p, subject: e.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-purple-500">
            <option value="" className="bg-dark-700">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s} className="bg-dark-700">{s}</option>)}
          </select>
          <select value={filters.semester} onChange={e => setFilters(p => ({ ...p, semester: e.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-purple-500">
            <option value="" className="bg-dark-700">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-dark-700">Sem {s}</option>)}
          </select>
        </div>
      </div>

      {loading ? <SkeletonList count={4} /> : notes.length === 0 ? (
        <EmptyState icon="📚" title="No notes found" description="Be the first to share study materials!" action={<Button onClick={() => setUploadOpen(true)}>Upload Note</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note, i) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card hover:border-purple-500/20 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <IoDocumentOutline size={22} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{note.title}</h3>
                  <p className="text-xs text-white/40">{note.subject} {note.semester ? `· Sem ${note.semester}` : ''}</p>
                </div>
              </div>
              {note.description && <p className="text-xs text-white/50 mb-3 line-clamp-2">{note.description}</p>}
              <div className="flex items-center gap-2 mb-3">
                <Avatar src={note.uploader_photo} name={note.uploader_name} size="xs" />
                <span className="text-xs text-white/40">{note.uploader_name} · {formatDate(note.created_at)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{formatFileSize(note.file_size)}</span>
                  <span>{note.downloads} downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleLike(note.id)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${note.is_liked ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                    {note.is_liked ? <IoHeart size={13} /> : <IoHeartOutline size={13} />} {note.likes_count}
                  </button>
                  <button onClick={() => handleDownload(note)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-500/20">
                    <IoDownloadOutline size={13} /> Download
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Note" size="md">
        <form onSubmit={handleUpload} className="space-y-4">
          <Input label="Title *" value={uploadData.title} onChange={e => setUploadData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Data Structures Unit 3 Notes" />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Subject *</label>
            <select className="input-field" value={uploadData.subject} onChange={e => setUploadData(p => ({ ...p, subject: e.target.value }))}>
              <option value="" className="bg-dark-700">Select subject</option>
              {SUBJECTS.map(s => <option key={s} value={s} className="bg-dark-700">{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Semester</label>
              <select className="input-field" value={uploadData.semester} onChange={e => setUploadData(p => ({ ...p, semester: e.target.value }))}>
                <option value="" className="bg-dark-700">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-dark-700">Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Department</label>
              <select className="input-field" value={uploadData.department} onChange={e => setUploadData(p => ({ ...p, department: e.target.value }))}>
                <option value="" className="bg-dark-700">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-dark-700">{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea className="input-field resize-none" rows={2} value={uploadData.description} onChange={e => setUploadData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">File (PDF/DOC) *</label>
            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500/50 transition-colors">
              {file ? (
                <div className="text-center">
                  <IoDocumentOutline size={24} className="text-purple-400 mx-auto mb-1" />
                  <p className="text-xs text-white/60">{file.name}</p>
                </div>
              ) : (
                <div className="text-center text-white/30">
                  <IoCloudUploadOutline size={24} className="mx-auto mb-1" />
                  <p className="text-xs">Click to select PDF or DOC file</p>
                </div>
              )}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={uploading} className="flex-1">Upload</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
