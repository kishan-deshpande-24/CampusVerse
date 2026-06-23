import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'already' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    // Backend: GET /auth/verify-email?token=...
    // Returns: { success: true, message } or 400 error
    api
      .get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        setMessage(data.message || 'Email verified successfully.');
        setStatus('success');
      })
      .catch((err) => {
        const msg = err.response?.data?.message || '';
        if (msg.toLowerCase().includes('already')) {
          setStatus('already');
          setMessage(msg);
        } else {
          setStatus('error');
          setMessage(msg || 'Invalid or expired verification link.');
        }
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md w-full"
      >
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-6 shadow-lg shadow-purple-500/30">
          <span className="text-2xl font-black text-white">C</span>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-white/60">Verifying your email...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="glass rounded-2xl p-8 border border-white/10">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-white/50 text-sm mb-2">{message}</p>
            <p className="text-white/40 text-sm mb-6">
              Your account is now pending admin approval. You'll receive an email
              once your college ID card is reviewed and approved.
            </p>
            <Link
              to="/login"
              className="btn-primary inline-flex items-center gap-2"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Already verified */}
        {status === 'already' && (
          <div className="glass rounded-2xl p-8 border border-white/10">
            <div className="text-6xl mb-4">ℹ️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Already Verified</h2>
            <p className="text-white/50 text-sm mb-6">{message}</p>
            <Link
              to="/login"
              className="btn-primary inline-flex items-center gap-2"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="glass rounded-2xl p-8 border border-red-500/20">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-white/50 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Go to Login
              </Link>
              <Link
                to="/register"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Register again
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
