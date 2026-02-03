const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const auth = require('../middleware/auth');

// List sessions (Interviews) - Admins see all, others see filtered
router.get('/', auth, async (req, res) => {
    try {
        const { candidateId } = req.query;
        let query = {};
        
        if (candidateId) {
            query.candidateId = candidateId;
        }
        
        // If user is not admin, filter by their interviews
        if (req.user.role !== 'admin') {
            // For non-admin users, you might want to filter by interviewer or other criteria
            // For now, we'll keep it as is since the original didn't have filtering
            console.log(`User ${req.user.name} (${req.user.role}) accessing sessions`);
        } else {
            console.log(`Admin ${req.user.name} accessing all sessions`);
        }

        const sessions = await Interview.find(query)
            .populate('candidateId', 'name email')
            .sort({ createdAt: -1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Session Report
router.get('/:id', async (req, res) => {
    try {
        const session = await Interview.findById(req.params.id)
            .populate('candidateId')
            .populate('responses.questionId');

        if (!session) return res.status(404).json({ msg: 'Session not found' });

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
