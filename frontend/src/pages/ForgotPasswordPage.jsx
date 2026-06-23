import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoMailOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');

    setLoading(true);
    try {
      // Backend always returns 200 with { success: true, message }
      // to prevent email enumeration — no error branch needed
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(data.message || 'Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
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
          <h1 className="text-2xl font-black gradient-text">Reset Password</h1>
          <p className="text-white/40 text-sm mt-1">We'll send you a reset link</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-lg font-bold text-white mb-2">Check your email</h3>
              <p className="text-white/40 text-sm">
                If <strong className="text-white">{email}</strong> is registered,
                a reset link has been sent. Check your inbox and spam folder.
              </p>
              <Link
                to="/login"
                className="inline-block mt-6 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-white/50 text-sm mb-2">
                Enter your registered email and we'll send you a password reset link.
              </p>

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                icon={<IoMailOutline size={16} />}
              />

              <Button type="submit" loading={loading} className="w-full">
                Send Reset Link
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
