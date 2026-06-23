const express = require('express');
const router = express.Router();
const { uploadPost } = require('../config/multer');
const { getOrCreateChat, getMyChats, getMessages, sendMessage, createGroupChat, updateGroupInfo, getGroupMembers, addGroupMembers, removeGroupMember } = require('../controllers/chatController');
const { protect, requireApproved } = require('../middleware/auth');

router.get('/', protect, getMyChats);
router.post('/group', protect, requireApproved, createGroupChat);
router.post('/with/:userId', protect, requireApproved, getOrCreateChat);
router.get('/:chatId/messages', protect, getMessages);
router.post('/:chatId/messages', protect, requireApproved, uploadPost.single('image'), sendMessage);
router.get('/:chatId/members', protect, getGroupMembers);
router.post('/:chatId/members', protect, requireApproved, addGroupMembers);
router.delete('/:chatId/members/:userId', protect, requireApproved, removeGroupMember);
router.patch('/:chatId/info', protect, requireApproved, updateGroupInfo);

module.exports = router;
