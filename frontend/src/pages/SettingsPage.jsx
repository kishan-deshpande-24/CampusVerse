import { useState } from 'react';
import { motion } from 'framer-motion';
import { IoPersonOutline, IoLockClosedOutline, IoTrashOutline, IoShieldOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('password');
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password.length < 8) return toast.error('New password must be at least 8 characters');
    if (passwords.new_password !== passwords.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.put('/users/me/password', { current_password: passwords.current_password, new_password: passwords.new_password });
      toast.success('Password changed successfully!');
      setPasswords({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This action cannot be undone. All your data will be permanently deleted.')) return;
    if (!confirm('Final confirmation: Delete your CampusVerse account?')) return;
    try {
      await api.delete('/users/me/account');
      logout();
      navigate('/login');
      toast.success('Account deleted');
    } catch { toast.error('Failed to delete account'); }
  };

  const tabs = [
    { id: 'password', label: 'Password', icon: IoLockClosedOutline },
    { id: 'privacy', label: 'Privacy', icon: IoShieldOutline },
    { id: 'danger', label: 'Danger Zone', icon: IoTrashOutline }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black gradient-text mb-6">Settings</h1>

      <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white/40 hover:text-white'}`}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'password' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="font-bold text-white mb-5">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input label="Current Password" type="password" value={passwords.current_password} onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))} placeholder="Enter current password" />
            <Input label="New Password" type="password" value={passwords.new_password} onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))} placeholder="Min 8 characters" />
            <Input label="Confirm New Password" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
            <Button type="submit" loading={loading} className="w-full">Update Password</Button>
          </form>
        </motion.div>
      )}

      {activeTab === 'privacy' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="font-bold text-white mb-5">Privacy Settings</h2>
          <div className="space-y-4">
            {[
              { label: 'Show my profile to everyone', desc: 'Your profile is visible to all approved students' },
              { label: 'Allow direct messages', desc: 'Other students can send you messages' },
              { label: 'Show online status', desc: 'Others can see when you are online' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                </div>
                <button className="w-12 h-6 bg-purple-600 rounded-full relative transition-colors">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'danger' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card border-red-500/20">
          <h2 className="font-bold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-white/50 mb-5">These actions are irreversible. Please be careful.</p>
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <h3 className="font-semibold text-white mb-1">Delete Account</h3>
            <p className="text-sm text-white/50 mb-4">Permanently delete your account and all associated data including posts, notes, and messages.</p>
            <Button variant="danger" onClick={handleDeleteAccount}>
              <IoTrashOutline size={15} /> Delete My Account
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
