const express = require('express');
const router = express.Router();
const { getNotifications, markRead, getUnreadCount } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/read', protect, markRead);
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
