import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

export default function PendingPage() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md w-full"
      >
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-6 shadow-lg shadow-purple-500/30">
          <span className="text-2xl font-black text-white">C</span>
        </div>

        <div className="text-7xl mb-5">⏳</div>

        <h1 className="text-3xl font-black gradient-text mb-3">
          Pending Approval
        </h1>

        {user?.full_name && (
          <p className="text-white/60 text-sm mb-1">
            Hi <strong className="text-white">{user.full_name}</strong>,
          </p>
        )}

        <p className="text-white/50 mb-2">
          Your account is under review by our admin team.
        </p>
        <p className="text-white/40 text-sm mb-8">
          We're verifying your college ID card. You'll receive an email at{' '}
          {user?.email && (
            <strong className="text-white/60">{user.email}</strong>
          )}{' '}
          once your account is approved. This usually takes 24–48 hours.
        </p>

        {/* Steps card */}
        <div className="glass rounded-2xl p-5 border border-white/10 mb-6 text-left space-y-3">
          {[
            { icon: '📋', label: 'Admin reviews your college ID card' },
            { icon: '📧', label: 'You receive an approval email' },
            { icon: '🎉', label: 'Login and explore CampusVerse' }
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg flex-shrink-0">
                {step.icon}
              </div>
              <p className="text-sm text-white/60">{step.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          ← Sign out and use a different account
        </button>
      </motion.div>
    </div>
  );
}
