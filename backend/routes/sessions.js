const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// List sessions (Interviews)
router.get('/', async (req, res) => {
    try {
        const { candidateId } = req.query;
        let query = {};
        if (candidateId) {
            query.candidateId = candidateId;
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
