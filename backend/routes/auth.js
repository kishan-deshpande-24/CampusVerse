const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// ── Multer — handles profile_photo and id_card uploads on /register ──────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route each fieldname to its own upload folder
    const folder = file.fieldname === 'id_card' ? 'id_cards' : 'profiles';
    const dir    = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext     = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
});

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/register
// Accepts multipart/form-data with fields: profile_photo (optional), id_card (required)
router.post(
  '/register',
  upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'id_card',       maxCount: 1 }
  ]),
  register
);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOtp);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/me  (requires valid JWT)
router.get('/me', protect, getMe);

module.exports = router;
