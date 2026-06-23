const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Strip sensitive columns before sending user object to client
const sanitizeUser = (user) => {
    const { password, email_verify_token, reset_token, reset_token_expires, ...safe } = user;
    return safe;
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
// Columns used: full_name, username, email, password, usn, department,
//               section, year, bio, profile_photo, id_card_image,
//               email_verify_token, status ('pending'), role ('student'),
//               email_verified (0)

exports.register = async(req, res) => {
    try {
        const { full_name, username, email, password, usn, department, section, year, bio } = req.body;

        // Required field validation
        if (!full_name || !username || !email || !password || !usn || !department || !year) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled' });
        }

        // Duplicate check across unique columns: email, username, usn
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR username = ? OR usn = ?', [email, username, usn]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email, username, or USN already exists' });
        }

        // id_card_image is required for admin verification
        const idCardImage = req.files?.id_card?.[0]
            ? `/uploads/id_cards/${req.files.id_card[0].filename}`
            : null;

        if (!idCardImage) {
            return res.status(400).json({ success: false, message: 'College ID card image is required' });
        }

        const profilePhoto = req.files?.profile_photo?.[0]
            ? `/uploads/profiles/${req.files.profile_photo[0].filename}`
            : null;

        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            `INSERT INTO users
         (full_name, username, email, password, usn, department, section, year,
          bio, profile_photo, id_card_image, otp, otp_expires,
          status, role, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'student', 0)`, [
                full_name,
                username,
                email,
                hashedPassword,
                usn,
                department,
                section || null,
                year,
                bio || null,
                profilePhoto,
                idCardImage,
                otp,
                otpExpires
            ]
        );

        // Send OTP email (non-blocking)
        sendVerificationEmail(email, full_name, otp).catch((err) =>
            console.error('OTP email failed:', err.message)
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful. A 6-digit OTP has been sent to your email.'
        });
    } catch (err) {
        console.error('register error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
// Reads: users.otp, users.otp_expires
// Writes: users.email_verified = 1, clears otp + otp_expires

exports.verifyOtp = async(req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

        const [rows] = await pool.query(
            'SELECT id, email_verified, otp, otp_expires FROM users WHERE email = ?', [email]
        );

        if (rows.length === 0) return res.status(400).json({ success: false, message: 'User not found' });

        const user = rows[0];

        if (user.email_verified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }

        if (user.otp !== otp || new Date() > new Date(user.otp_expires)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await pool.query(
            'UPDATE users SET email_verified = 1, otp = NULL, otp_expires = NULL WHERE id = ?', [user.id]
        );

        res.json({ success: true, message: 'Email verified. Waiting for admin approval.' });
    } catch (err) {
        console.error('verifyOtp error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────

exports.resendOtp = async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const [rows] = await pool.query(
            'SELECT id, full_name, email_verified FROM users WHERE email = ?', [email]
        );

        if (rows.length === 0) return res.status(400).json({ success: false, message: 'User not found' });
        if (rows[0].email_verified) return res.status(400).json({ success: false, message: 'Email already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            'UPDATE users SET otp = ?, otp_expires = ? WHERE id = ?', [otp, otpExpires, rows[0].id]
        );

        sendVerificationEmail(email, rows[0].full_name, otp).catch((err) =>
            console.error('Resend OTP email failed:', err.message)
        );

        res.json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (err) {
        console.error('resendOtp error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// Checks: email_verified, status (pending / rejected / banned / approved)
// Writes: users.last_active

exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = rows[0];

        // Gate 1 — email must be verified
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        // Gate 2 — account status checks
        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval',
                code: 'PENDING_APPROVAL'
            });
        }
        if (user.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: 'Your account application was rejected',
                code: 'REJECTED'
            });
        }
        if (user.status === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned',
                code: 'BANNED'
            });
        }

        // Gate 3 — password check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Update last_active timestamp
        await pool.query('UPDATE users SET last_active = NOW() WHERE id = ?', [user.id]);

        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: sanitizeUser(user)
        });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
// Writes: users.reset_token, users.reset_token_expires

exports.forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const [rows] = await pool.query(
            'SELECT id, full_name FROM users WHERE email = ?', [email]
        );

        // Always return 200 to prevent email enumeration
        if (rows.length === 0) {
            return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [resetToken, expires, rows[0].id]
        );

        sendPasswordResetEmail(email, rows[0].full_name, resetToken).catch((err) =>
            console.error('Reset email failed:', err.message)
        );

        res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    } catch (err) {
        console.error('forgotPassword error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
// Reads:  users.reset_token, users.reset_token_expires
// Writes: users.password, clears reset_token + reset_token_expires

exports.resetPassword = async(req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        // reset_token_expires > NOW() ensures the token hasn't expired
        const [rows] = await pool.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const hashed = await bcrypt.hash(password, 12);

        await pool.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashed, rows[0].id]
        );

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error('resetPassword error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── GET ME ──────────────────────────────────────────────────────────────────
// Returns the authenticated user's full profile with aggregated counts
// Joins: follows (followers_count, following_count), posts (posts_count)

exports.getMe = async(req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
         u.id, u.full_name, u.username, u.email, u.usn,
         u.department, u.section, u.year, u.bio,
         u.profile_photo, u.cover_photo,
         u.skills, u.interests, u.social_links,
         u.role, u.status, u.email_verified,
         u.last_active, u.created_at, u.updated_at,
         (SELECT COUNT(*) FROM follows  WHERE following_id = u.id) AS followers_count,
         (SELECT COUNT(*) FROM follows  WHERE follower_id  = u.id) AS following_count,
         (SELECT COUNT(*) FROM posts    WHERE user_id = u.id AND is_anonymous = 0) AS posts_count,
         (SELECT COUNT(*) FROM notes    WHERE user_id = u.id) AS notes_count
       FROM users u
       WHERE u.id = ?`, [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('getMe error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};