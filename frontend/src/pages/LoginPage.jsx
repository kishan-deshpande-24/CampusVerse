import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  IoEyeOutline,
  IoEyeOffOutline,
  IoMailOutline,
  IoLockClosedOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      // store.login returns { success, token, user }
      const res = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${res.user.full_name}!`);
      navigate(res.user.role === 'admin' ? '/admin' : '/feed');
    } catch (err) {
      const code = err.response?.data?.code;
      const msg  = err.response?.data?.message || 'Login failed';

      if (code === 'PENDING_APPROVAL') {
        navigate('/pending');
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first');
      } else if (code === 'REJECTED') {
        toast.error('Your account application was rejected');
      } else if (code === 'BANNED') {
        toast.error('Your account has been banned');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-4 shadow-lg shadow-purple-500/30">
            <span className="text-3xl font-black text-white">C</span>
          </div>
          <h1 className="text-3xl font-black gradient-text">CampusVerse</h1>
          <p className="text-white/40 mt-1 text-sm">Your digital campus awaits</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Sign in</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="you@college.edu"
              icon={<IoMailOutline size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password with show/hide */}
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<IoLockClosedOutline size={16} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-9 text-white/30 hover:text-white transition-colors"
              >
                {showPass ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
