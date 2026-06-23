const express = require('express');
const router = express.Router();
const { uploadMarketplace } = require('../config/multer');
const { createListing, getListings, getListing, markSold, deleteListing } = require('../controllers/marketplaceController');
const { protect, requireApproved } = require('../middleware/auth');

router.get('/', protect, getListings);
router.post('/', protect, requireApproved, uploadMarketplace.array('images', 5), createListing);
router.get('/:id', protect, getListing);
router.put('/:id/sold', protect, requireApproved, markSold);
router.delete('/:id', protect, requireApproved, deleteListing);

module.exports = router;
