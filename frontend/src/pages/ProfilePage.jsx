import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoLocationOutline, IoMailOutline, IoCalendarOutline, IoDocumentTextOutline, IoPeopleOutline, IoCreateOutline, IoPersonAddOutline, IoPersonRemoveOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import PostCard from '../components/feed/PostCard';
import { SkeletonList } from '../components/ui/Skeleton';
import { formatDate, getImageUrl } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  const isMe = me?.username === username;

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}`)
      .then(r => { setProfile(r.data); setEditData({ full_name: r.data.full_name, bio: r.data.bio || '', department: r.data.department, year: r.data.year, skills: r.data.skills || '', interests: r.data.interests || '' }); })
      .catch(() => navigate('/feed'))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    api.get(`/posts/user/${profile.id}`)
      .then(r => setPosts(r.data))
      .finally(() => setPostsLoading(false));
  }, [profile]);

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/users/${profile.id}/follow`);
      setProfile(prev => ({
        ...prev,
        is_following: data.following,
        followers_count: data.following ? prev.followers_count + 1 : prev.followers_count - 1
      }));
    } catch { toast.error('Failed'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const fd = new FormData();
      Object.entries(editData).forEach(([k, v]) => v !== undefined && fd.append(k, v));
      if (profileFile) fd.append('profile_photo', profileFile);
      if (coverFile) fd.append('cover_photo', coverFile);
      const { data } = await api.put('/users/me/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => ({ ...prev, ...data }));
      updateUser(data);
      setEditOpen(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); } finally { setEditLoading(false); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="h-48 bg-white/5 rounded-2xl animate-pulse mb-4" />
      <SkeletonList count={2} />
    </div>
  );

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Cover */}
      <div className="relative h-48 rounded-2xl overflow-hidden mb-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50">
        {profile.cover_photo && <img src={getImageUrl(profile.cover_photo)} alt="cover" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
      </div>

      {/* Profile info */}
      <div className="glass rounded-2xl border border-white/10 p-5 mb-5 -mt-6 relative">
        <div className="flex items-end justify-between mb-4">
          <div className="-mt-14">
            <Avatar src={profile.profile_photo} name={profile.full_name} size="2xl" className="ring-4 ring-dark-900" />
          </div>
          <div className="flex gap-2">
            {isMe ? (
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                <IoCreateOutline size={15} /> Edit Profile
              </Button>
            ) : (
              <Button
                variant={profile.is_following ? 'ghost' : 'primary'}
                size="sm"
                onClick={handleFollow}
              >
                {profile.is_following ? <><IoPersonRemoveOutline size={15} /> Unfollow</> : <><IoPersonAddOutline size={15} /> Follow</>}
              </Button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-black text-white">{profile.full_name}</h1>
        <p className="text-white/50 text-sm">@{profile.username}</p>
        {profile.bio && <p className="text-white/70 text-sm mt-2 leading-relaxed">{profile.bio}</p>}

        <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/50">
          <span className="flex items-center gap-1.5"><IoLocationOutline size={14} />{profile.department} · Year {profile.year}</span>
          {profile.section && <span>Section {profile.section}</span>}
          <span className="flex items-center gap-1.5"><IoCalendarOutline size={14} />Joined {formatDate(profile.created_at)}</span>
        </div>

        {profile.skills && (
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
        )}

        <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.posts_count || 0}</p>
            <p className="text-xs text-white/40">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.followers_count || 0}</p>
            <p className="text-xs text-white/40">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.following_count || 0}</p>
            <p className="text-xs text-white/40">Following</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.notes_count || 0}</p>
            <p className="text-xs text-white/40">Notes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white/5 rounded-xl p-1">
        {['posts', 'notes'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white/40 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'posts' && (
        postsLoading ? <SkeletonList count={2} /> :
        posts.length === 0 ? <div className="text-center py-12 text-white/30">No posts yet</div> :
        posts.map(p => <PostCard key={p.id} post={p} onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))} />)
      )}

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Profile Photo</label>
              <label className="flex items-center justify-center h-20 border border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500/50 transition-colors text-white/30 text-xs">
                {profileFile ? profileFile.name : 'Upload photo'}
                <input type="file" accept="image/*" className="hidden" onChange={e => setProfileFile(e.target.files[0])} />
              </label>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Cover Photo</label>
              <label className="flex items-center justify-center h-20 border border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500/50 transition-colors text-white/30 text-xs">
                {coverFile ? coverFile.name : 'Upload cover'}
                <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files[0])} />
              </label>
            </div>
          </div>
          <Input label="Full Name" value={editData.full_name || ''} onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Bio</label>
            <textarea className="input-field resize-none" rows={3} value={editData.bio || ''} onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." />
          </div>
          <Input label="Skills (comma separated)" value={editData.skills || ''} onChange={e => setEditData(p => ({ ...p, skills: e.target.value }))} placeholder="React, Python, ML..." />
          <Input label="Interests (comma separated)" value={editData.interests || ''} onChange={e => setEditData(p => ({ ...p, interests: e.target.value }))} placeholder="Coding, Music, Sports..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={editLoading} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
