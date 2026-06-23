import { useState } from 'react';
import { motion } from 'framer-motion';
import { IoImageOutline, IoEyeOffOutline, IoSendOutline, IoClose } from 'react-icons/io5';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import api from '../../api/axios';

const POST_TYPES = ['text', 'question', 'announcement', 'confession'];

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return toast.error('Write something or add an image');
    setLoading(true);
    try {
      const fd = new FormData();
      if (content) fd.append('content', content);
      fd.append('type', type);
      fd.append('is_anonymous', isAnonymous);
      if (image) fd.append('image', image);

      const { data } = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onPostCreated?.(data);
      setContent(''); setImage(null); setPreview(null); setType('text'); setIsAnonymous(false);
      toast.success('Post created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card mb-4">
      <div className="flex gap-3">
        <Avatar src={user?.profile_photo} name={user?.full_name} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={isAnonymous ? "Share anonymously..." : "What's on your mind?"}
            rows={3}
            className="w-full bg-transparent text-white placeholder-white/30 resize-none focus:outline-none text-sm leading-relaxed"
          />

          {preview && (
            <div className="relative mt-2 rounded-xl overflow-hidden">
              <img src={preview} alt="preview" className="max-h-64 w-full object-cover rounded-xl" />
              <button onClick={() => { setImage(null); setPreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80">
                <IoClose size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <label className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white cursor-pointer transition-colors">
                <IoImageOutline size={18} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>

              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/60 focus:outline-none focus:border-purple-500 capitalize"
              >
                {POST_TYPES.map(t => <option key={t} value={t} className="bg-dark-700">{t}</option>)}
              </select>

              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isAnonymous ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-white/40 hover:bg-white/5'}`}
              >
                <IoEyeOffOutline size={14} />
                {isAnonymous ? 'Anonymous' : 'Public'}
              </button>
            </div>

            <Button onClick={handleSubmit} loading={loading} size="sm" disabled={!content.trim() && !image}>
              <IoSendOutline size={14} /> Post
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
