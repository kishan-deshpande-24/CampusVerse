import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ResetPasswordPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      return toast.error('Invalid reset link. Please request a new one.');
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    if (password !== confirm) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      // Backend: POST /auth/reset-password { token, password }
      // Returns: { success: true, message }
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-4 shadow-lg shadow-purple-500/30">
            <span className="text-3xl font-black text-white">C</span>
          </div>
          <h1 className="text-2xl font-black gradient-text">Set New Password</h1>
          <p className="text-white/40 text-sm mt-1">Choose a strong password</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">

          {!token ? (
            /* ── No token in URL ── */
            <div className="text-center py-4">
              <div className="text-5xl mb-4">❌</div>
              <h3 className="text-lg font-bold text-white mb-2">Invalid Link</h3>
              <p className="text-white/40 text-sm mb-6">
                This reset link is invalid or missing. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Request new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* New password */}
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  icon={<IoLockClosedOutline size={16} />}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-9 text-white/30 hover:text-white transition-colors"
                >
                  {showPass ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
                </button>
              </div>

              {/* Confirm password */}
              <Input
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                icon={<IoLockClosedOutline size={16} />}
              />

              {/* Password strength hint */}
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-yellow-400">
                  Password needs {8 - password.length} more character{8 - password.length !== 1 ? 's' : ''}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Reset Password
              </Button>

              <p className="text-center text-sm text-white/40">
                <Link
                  to="/login"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ← Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
