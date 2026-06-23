const express = require('express');
const router = express.Router();
const { getDashboard, getPendingUsers, approveUser, rejectUser, banUser, getAllUsers, getReports, resolveReport, adminDeletePost } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.get('/users/pending', getPendingUsers);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/reject', rejectUser);
router.put('/users/:id/ban', banUser);
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.delete('/posts/:id', adminDeletePost);

module.exports = router;
