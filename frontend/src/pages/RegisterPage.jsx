import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  IoPersonOutline,
  IoAtOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoIdCardOutline,
  IoSchoolOutline,
  IoImageOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// ─── Zod schema — field names match schema.sql columns exactly ───────────────
// schema.sql columns: full_name, username, email, password, usn,
//                     department, section, year, bio
const schema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),

    username: z
      .string()
      .min(3, 'Minimum 3 characters')
      .max(20, 'Maximum 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore'),

    email: z.string().email('Invalid email address'),

    password: z.string().min(8, 'Minimum 8 characters'),

    confirm_password: z.string(),

    // schema column: usn VARCHAR(50) NOT NULL UNIQUE
    usn: z.string().min(3, 'USN / Student ID is required'),

    // schema column: department VARCHAR(100) NOT NULL
    department: z.string().min(2, 'Department is required'),

    // schema column: year TINYINT NOT NULL
    year: z.string().min(1, 'Year is required'),

    // schema column: section VARCHAR(10)  (nullable)
    section: z.string().optional(),

    // schema column: bio TEXT  (nullable)
    bio: z.string().optional()
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password']
  });

const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Information Science',
  'Chemical',
  'Biotechnology',
  'MBA',
  'MCA',
  'Other'
];

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading]           = useState(false);
  const [step, setStep]                 = useState(1);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [idCard, setIdCard]             = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [idPreview, setIdPreview]       = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger
  } = useForm({ resolver: zodResolver(schema) });

  // ── File handlers ──────────────────────────────────────────────────────────
  const handleProfilePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleIdCard = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdCard(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  // ── Step navigation ────────────────────────────────────────────────────────
  const nextStep = async () => {
    // Validate only the fields visible on the current step
    const stepFields = {
      1: ['full_name', 'username', 'email', 'password', 'confirm_password'],
      2: ['usn', 'department', 'year']
    };
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  };

  // ── Form submit ────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!idCard) return toast.error('College ID card is required');

    setLoading(true);
    try {
      const fd = new FormData();

      // Append all text fields — key names match schema.sql columns exactly
      // full_name, username, email, password, usn, department, year, section, bio
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'confirm_password') return; // never send to backend
        if (value !== undefined && value !== '') fd.append(key, value);
      });

      // File fields — multer fieldnames: 'profile_photo', 'id_card'
      if (profilePhoto) fd.append('profile_photo', profilePhoto);
      fd.append('id_card', idCard);

      // store.register returns { success, message }
      const res = await registerUser(fd);
      toast.success(res.message || 'Registration successful! Check your email for the OTP.');
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4 py-8">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-3 shadow-lg shadow-purple-500/30">
            <span className="text-2xl font-black text-white">C</span>
          </div>
          <h1 className="text-2xl font-black gradient-text">Join CampusVerse</h1>
          <p className="text-white/40 text-sm mt-1">Create your student account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-purple-500'
                  : s < step
                  ? 'w-4 bg-purple-500/60'
                  : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-7 border border-white/10">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── STEP 1 — Account details ─────────────────────────────── */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="font-bold text-white mb-4">Account Details</h3>

                {/* full_name → schema: full_name VARCHAR(100) NOT NULL */}
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<IoPersonOutline size={15} />}
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                {/* username → schema: username VARCHAR(50) NOT NULL UNIQUE */}
                <Input
                  label="Username"
                  placeholder="john_doe"
                  icon={<IoAtOutline size={15} />}
                  error={errors.username?.message}
                  {...register('username')}
                />

                {/* email → schema: email VARCHAR(100) NOT NULL UNIQUE */}
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@college.edu"
                  icon={<IoMailOutline size={15} />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                {/* password → schema: password VARCHAR(255) NOT NULL */}
                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  icon={<IoLockClosedOutline size={15} />}
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat password"
                  icon={<IoLockClosedOutline size={15} />}
                  error={errors.confirm_password?.message}
                  {...register('confirm_password')}
                />

                <Button type="button" onClick={nextStep} className="w-full mt-2">
                  Next →
                </Button>
              </motion.div>
            )}

            {/* ── STEP 2 — Academic details ────────────────────────────── */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="font-bold text-white mb-4">Academic Details</h3>

                {/* usn → schema: usn VARCHAR(50) NOT NULL UNIQUE */}
                <Input
                  label="USN / Student ID"
                  placeholder="1XX21CS001"
                  icon={<IoIdCardOutline size={15} />}
                  error={errors.usn?.message}
                  {...register('usn')}
                />

                {/* department → schema: department VARCHAR(100) NOT NULL */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Department
                  </label>
                  <select
                    className="input-field"
                    {...register('department')}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="bg-dark-700">
                        {d}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.department.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* year → schema: year TINYINT NOT NULL */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Year
                    </label>
                    <select
                      className="input-field"
                      {...register('year')}
                    >
                      <option value="">Select Year</option>
                      {[1, 2, 3, 4].map((y) => (
                        <option key={y} value={String(y)} className="bg-dark-700">
                          {y} Year
                        </option>
                      ))}
                    </select>
                    {errors.year && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.year.message}
                      </p>
                    )}
                  </div>

                  {/* section → schema: section VARCHAR(10) (nullable) */}
                  <Input
                    label="Section (optional)"
                    placeholder="A, B, C..."
                    {...register('section')}
                  />
                </div>

                {/* bio → schema: bio TEXT (nullable) */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Bio (optional)
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                    {...register('bio')}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-1">
                    Next →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3 — Upload photos ───────────────────────────────── */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <h3 className="font-bold text-white mb-4">Upload Photos</h3>

                {/* profile_photo → schema: profile_photo VARCHAR(255) (nullable) */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Profile Photo{' '}
                    <span className="text-white/30 text-xs">(optional)</span>
                  </label>
                  {/* Circle avatar shape — same proportions as how it appears in the app */}
                  <div className="flex items-center gap-4">
                    <label className="relative cursor-pointer flex-shrink-0">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-colors overflow-hidden flex items-center justify-center bg-white/5">
                        {profilePreview ? (
                          <img
                            src={profilePreview}
                            alt="profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IoImageOutline size={24} className="text-white/30" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePhoto}
                      />
                    </label>
                    <div className="text-xs text-white/30 leading-relaxed">
                      {profilePreview ? (
                        <span className="text-purple-400">Photo selected ✓</span>
                      ) : (
                        <>
                          <p>Click the circle to upload</p>
                          <p className="mt-0.5">JPG, PNG or WebP · max 5 MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* id_card_image → schema: id_card_image VARCHAR(255) (required for approval) */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    College ID Card{' '}
                    <span className="text-red-400">*</span>
                  </label>
                  {/* Landscape card shape — matches real ID card proportions (85.6 × 54 mm ≈ 16:10) */}
                  <label
                    className={`relative flex items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden ${
                      idCard
                        ? 'border-purple-500/60 bg-purple-500/5'
                        : 'border-white/10 hover:border-purple-500/50 bg-white/2'
                    }`}
                    style={{ aspectRatio: '16 / 10' }}
                  >
                    {idPreview ? (
                      <img
                        src={idPreview}
                        alt="ID card preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/30 p-4">
                        <IoIdCardOutline size={32} />
                        <span className="text-xs font-medium">Upload your college ID card</span>
                        <span className="text-[10px] text-white/20">
                          JPG, PNG or WebP · max 10 MB
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIdCard}
                    />
                  </label>
                  <p className="mt-1.5 text-xs text-white/30">
                    {idCard
                      ? <span className="text-green-400">✓ {idCard.name}</span>
                      : 'Admin will verify your ID before activating your account'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!idCard}
                    className="flex-1"
                  >
                    Create Account
                  </Button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
