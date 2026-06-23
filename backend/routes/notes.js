const express = require('express');
const router = express.Router();
const { uploadNote } = require('../config/multer');
const { uploadNote: uploadNoteCtrl, getNotes, getNote, likeNote, commentNote, getNoteComments, deleteNote } = require('../controllers/noteController');
const { protect, requireApproved } = require('../middleware/auth');

router.get('/', protect, getNotes);
router.post('/', protect, requireApproved, uploadNote.single('file'), uploadNoteCtrl);
router.get('/:id', protect, getNote);
router.delete('/:id', protect, requireApproved, deleteNote);
router.post('/:id/like', protect, requireApproved, likeNote);
router.get('/:id/comments', protect, getNoteComments);
router.post('/:id/comments', protect, requireApproved, commentNote);

module.exports = router;
