const express = require('express');
const router = express.Router();
const { createTeam, getTeams, getTeam, requestJoin, handleRequest, getTeamRequests, getUserTeams } = require('../controllers/teamController');
const { protect, requireApproved } = require('../middleware/auth');

router.get('/', protect, getTeams);
router.post('/', protect, requireApproved, createTeam);
router.get('/my', protect, getUserTeams);
router.get('/:id', protect, getTeam);
router.post('/:id/join', protect, requireApproved, requestJoin);
router.get('/:id/requests', protect, requireApproved, getTeamRequests);
router.put('/requests/:requestId', protect, requireApproved, handleRequest);

module.exports = router;
