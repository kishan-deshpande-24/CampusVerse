import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoAddOutline, IoPeopleOutline, IoCodeSlashOutline, IoCheckmarkOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import { formatDate } from '../utils/helpers';
import api from '../api/axios';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', required_skills: '', max_members: 5, project_type: '' });
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = search ? `?q=${search}` : '';
      const { data } = await api.get(`/teams${params}`);
      setTeams(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTeams(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return toast.error('Name and description required');
    setCreating(true);
    try {
      const { data } = await api.post('/teams', formData);
      setTeams(prev => [{ ...data, member_count: 1 }, ...prev]);
      setCreateOpen(false);
      setFormData({ name: '', description: '', required_skills: '', max_members: 5, project_type: '' });
      toast.success('Team created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setCreating(false); }
  };

  const handleJoin = async (teamId) => {
    setJoiningId(teamId);
    try {
      await api.post(`/teams/${teamId}/join`, { message: 'I would like to join your team!' });
      toast.success('Join request sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setJoiningId(null); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black gradient-text">Team Finder</h1>
          <p className="text-white/40 text-sm mt-0.5">Find teammates for your next project</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><IoAddOutline size={16} /> Create Team</Button>
      </div>

      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams by name or skills..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
      </div>

      {loading ? <SkeletonList count={3} /> : teams.length === 0 ? (
        <EmptyState icon="👥" title="No teams found" description="Create a team and find your perfect project partners!" action={<Button onClick={() => setCreateOpen(true)}>Create Team</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team, i) => (
            <motion.div key={team.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card hover:border-purple-500/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center">
                  <IoPeopleOutline size={22} className="text-purple-400" />
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${team.status === 'open' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {team.status}
                </span>
              </div>
              <h3 className="font-bold text-white mb-1">{team.name}</h3>
              <p className="text-sm text-white/50 mb-3 line-clamp-2">{team.description}</p>
              {team.required_skills && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {team.required_skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} className="tag text-[10px]">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <IoPeopleOutline size={13} />
                  <span>{team.member_count}/{team.max_members} members</span>
                </div>
                {team.status === 'open' && team.member_count < team.max_members && (
                  <Button size="sm" variant="outline" onClick={() => handleJoin(team.id)} loading={joiningId === team.id}>
                    Request to Join
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Team" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Team Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="WebDev Warriors" />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description *</label>
            <textarea className="input-field resize-none" rows={3} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="What is your project about?" />
          </div>
          <Input label="Required Skills (comma separated)" value={formData.required_skills} onChange={e => setFormData(p => ({ ...p, required_skills: e.target.value }))} placeholder="React, Node.js, MySQL" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max Members" type="number" min={2} max={20} value={formData.max_members} onChange={e => setFormData(p => ({ ...p, max_members: e.target.value }))} />
            <Input label="Project Type" value={formData.project_type} onChange={e => setFormData(p => ({ ...p, project_type: e.target.value }))} placeholder="Web App, ML, IoT..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={creating} className="flex-1">Create Team</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
