const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const Candidate = require('../models/Candidate');
const auth = require('../middleware/auth');

// List all Slots (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Permission denied' });
        }
        const slots = await Slot.find()
            .populate('interviewerId', 'name')
            .populate('candidateId', 'name')
            .sort({ startTime: 1 });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Slot (Admin/Candidate)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'candidate') {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const { startTime, endTime, interviewerId } = req.body;
        const newSlot = new Slot({
            interviewerId: interviewerId || req.user.id,
            startTime,
            endTime
        });

        const savedSlot = await newSlot.save();
        res.status(201).json(savedSlot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Available Slots (Candidate)
router.get('/available', async (req, res) => {
    try {
        const slots = await Slot.find({ status: 'Available', startTime: { $gt: new Date() } })
            .populate('interviewerId', 'name');
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Book Slot (Candidate)
router.post('/book/:id', auth, async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot || slot.status !== 'Available') {
            return res.status(400).json({ error: 'Slot not available' });
        }

        slot.status = 'Booked';
        slot.candidateId = req.user.id;
        // Internal Meeting System
        slot.meetingLink = `/interview/meeting/${slot._id}`;

        await slot.save();

        // Update Candidate Status
        await Candidate.findByIdAndUpdate(req.user.id, { status: 'Slot_Booked' });

        res.json(slot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit Feedback (Interviewer/Candidate)
router.post('/feedback/:id', auth, async (req, res) => {
    try {
        const { score, remarks, metrics, type } = req.body;
        const slot = await Slot.findById(req.params.id);

        if (!slot) return res.status(404).json({ error: 'Slot not found' });

        if (type === 'interviewer') {
            slot.interviewerFeedback = { score, remarks, metrics };
        } else if (type === 'candidate') {
            slot.candidateFeedback = { score, remarks };
        }

        // If both interviewer and candidate have given feedback, mark as completed
        if (slot.interviewerFeedback?.score && slot.candidateFeedback?.score) {
            slot.status = 'Completed';
            
            // Update Candidate Status to Round 2 Completed
            if (slot.candidateId) {
                await Candidate.findByIdAndUpdate(slot.candidateId, { 
                    status: 'Round_2_Completed',
                    overallScore: slot.interviewerFeedback?.score || 0
                });
            }
        }

        await slot.save();
        res.json(slot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
