const express = require('express');
const router = express.Router();
const { uploadEvent } = require('../config/multer');
const { createEvent, getEvents, getEvent, registerEvent, toggleReminder, downloadEventPdf, deleteEvent } = require('../controllers/eventController');
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

router.get('/', optionalAuth, getEvents);
router.post('/', protect, requireApproved, uploadEvent.single('pdf_file'), createEvent);
router.get('/:id', optionalAuth, getEvent);
router.post('/:id/register', protect, requireApproved, registerEvent);
router.post('/:id/reminder', protect, requireApproved, toggleReminder);
router.get('/:id/download', protect, downloadEventPdf);
router.delete('/:id', protect, requireApproved, deleteEvent);

module.exports = router;
