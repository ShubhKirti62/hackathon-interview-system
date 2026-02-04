const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendRound2Invite } = require('../utils/emailService');

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

        const { startTime, endTime, interviewerId, candidateId } = req.body;

        // Create slot
        const newSlot = new Slot({
            interviewerId: interviewerId || req.user.id,
            candidateId: candidateId || null,
            startTime,
            endTime,
            status: candidateId ? 'Booked' : 'Available'
        });

        const savedSlot = await newSlot.save();

        // If a candidate is assigned, generate meeting link and send email
        if (candidateId) {
            // Generate meeting link using the slot ID
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const meetingLink = `${baseUrl}/interview/meeting/${savedSlot._id}`;

            // Update slot with meeting link
            savedSlot.meetingLink = meetingLink;
            await savedSlot.save();

            // Get candidate and interviewer details
            const candidate = await Candidate.findById(candidateId);
            const interviewer = await User.findById(interviewerId);

            if (candidate) {
                // Format date and time for email
                const startDate = new Date(startTime);
                const interviewDate = startDate.toISOString().split('T')[0];
                const interviewTime = startDate.toTimeString().slice(0, 5);

                // Send Round 2 invitation email
                try {
                    await sendRound2Invite(
                        candidate.email,
                        candidate.name,
                        interviewDate,
                        interviewTime,
                        meetingLink,
                        interviewer?.name || 'Technical Team'
                    );
                    console.log(`Round 2 invite sent to ${candidate.email}`);
                } catch (emailError) {
                    console.error('Failed to send email:', emailError);
                    // Continue even if email fails - slot is created
                }

                // Update candidate status to Round 2 Scheduled
                candidate.status = 'Round_2_Scheduled';
                candidate.interviewLink = meetingLink;
                candidate.interviewDate = startDate;
                await candidate.save();
            }
        }

        res.status(201).json(savedSlot);
    } catch (error) {
        console.error('Error creating slot:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Slot (Admin only) - temporarily without auth for testing
router.patch('/:id', async (req, res) => {
    try {
        console.log('PATCH slot request:', req.params.id, req.body);
        // Temporarily skip auth check for testing
        // if (req.user.role !== 'admin') {
        //     return res.status(403).json({ error: 'Permission denied' });
        // }

        const { startTime, endTime, interviewerId, candidateId } = req.body;
        
        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            console.log('Slot not found:', req.params.id);
            return res.status(404).json({ error: 'Slot not found' });
        }

        console.log('Found slot:', slot.status);

        // Only allow editing available slots
        if (slot.status !== 'Available') {
            return res.status(400).json({ error: 'Can only edit available slots' });
        }

        // Update fields if provided
        if (startTime) slot.startTime = new Date(startTime);
        if (endTime) slot.endTime = new Date(endTime);
        if (interviewerId) slot.interviewerId = interviewerId;
        if (candidateId !== undefined) {
            slot.candidateId = candidateId || null;
            slot.status = candidateId ? 'Booked' : 'Available';
        }

        const updatedSlot = await slot.save();
        console.log('Slot updated successfully');
        res.json(updatedSlot);
    } catch (error) {
        console.error('Error updating slot:', error);
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

// Delete a single slot (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        // If slot had a candidate, revert their status
        if (slot.candidateId) {
            await Candidate.findByIdAndUpdate(slot.candidateId, {
                status: 'Interviewed',
                $unset: { interviewLink: 1, interviewDate: 1 }
            });
        }

        await Slot.findByIdAndDelete(req.params.id);
        res.json({ message: 'Slot deleted successfully' });
    } catch (error) {
        console.error('Error deleting slot:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete all slots (Admin only)
router.delete('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Get all slots with candidates to revert their status
        const slotsWithCandidates = await Slot.find({ candidateId: { $ne: null } });

        // Revert candidate statuses
        for (const slot of slotsWithCandidates) {
            await Candidate.findByIdAndUpdate(slot.candidateId, {
                status: 'Interviewed',
                $unset: { interviewLink: 1, interviewDate: 1 }
            });
        }

        const result = await Slot.deleteMany({});
        res.json({ message: `${result.deletedCount} slots deleted successfully` });
    } catch (error) {
        console.error('Error deleting all slots:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
