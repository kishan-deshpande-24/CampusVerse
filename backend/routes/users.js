const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getProfile, updateProfile, changePassword, followUser, getFollowers, getFollowing, searchUsers, deleteAccount } = require('../controllers/userController');
const { protect, requireApproved } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'cover_photo' ? 'covers' : 'profiles';
    const dir = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/search', protect, requireApproved, searchUsers);
router.get('/:username', protect, getProfile);
router.put('/me/profile', protect, requireApproved, upload.fields([{ name: 'profile_photo', maxCount: 1 }, { name: 'cover_photo', maxCount: 1 }]), updateProfile);
router.put('/me/password', protect, requireApproved, changePassword);
router.delete('/me/account', protect, deleteAccount);
router.post('/:id/follow', protect, requireApproved, followUser);
router.get('/:id/followers', protect, getFollowers);
router.get('/:id/following', protect, getFollowing);

module.exports = router;
