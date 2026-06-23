const express = require('express');
const router = express.Router();
const { uploadPost } = require('../config/multer');
const { createPost, getFeed, getPost, updatePost, deletePost, likePost, getComments, addComment, deleteComment, bookmarkPost, getUserPosts, reportPost, searchPosts } = require('../controllers/postController');
const { protect, requireApproved } = require('../middleware/auth');

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  const jwt = require('jsonwebtoken');
  const { pool } = require('../config/db');
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (!err) {
      const [rows] = await pool.query('SELECT id, username, role, status FROM users WHERE id = ?', [decoded.id]);
      if (rows.length) req.user = rows[0];
    }
    next();
  });
};

router.get('/search', optionalAuth, searchPosts);
router.get('/feed', optionalAuth, getFeed);
router.get('/user/:userId', optionalAuth, getUserPosts);
router.post('/', protect, requireApproved, uploadPost.single('image'), createPost);
router.get('/:id', optionalAuth, getPost);
router.put('/:id', protect, requireApproved, updatePost);
router.delete('/:id', protect, requireApproved, deletePost);
router.post('/:id/like', protect, requireApproved, likePost);
router.post('/:id/bookmark', protect, requireApproved, bookmarkPost);
router.post('/:id/report', protect, requireApproved, reportPost);
router.get('/:id/comments', optionalAuth, getComments);
router.post('/:id/comments', protect, requireApproved, addComment);
router.delete('/:id/comments/:commentId', protect, requireApproved, deleteComment);

module.exports = router;
