const express = require('express');
const router = express.Router();
const { uploadLostFound } = require('../config/multer');
const { reportLost, getLostFound, markFound } = require('../controllers/lostFoundController');
const { protect, requireApproved } = require('../middleware/auth');

router.get('/', protect, getLostFound);
router.post('/', protect, requireApproved, uploadLostFound.single('image'), reportLost);
router.put('/:id/found', protect, requireApproved, markFound);

module.exports = router;
