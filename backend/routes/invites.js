const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const { sendInterviewInvite } = require('../utils/emailService');

// @route   POST /api/invites/send
// @desc    Send interview invitation email
// @access  Private (Admin)
router.post('/send', async (req, res) => {
    const { candidateId, interviewDate, interviewTime, meetingLink, message } = req.body;

    if (!candidateId || !interviewDate || !interviewTime || !meetingLink) {
        return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ msg: 'Candidate not found' });
        }

        // Send Email
        await sendInterviewInvite(
            candidate.email,
            candidate.name,
            interviewDate,
            interviewTime,
            meetingLink,
            message
        );

        // Update Candidate Status and Save Interview Details
        candidate.status = 'interview_1st_round_pending';
        candidate.interviewLink = meetingLink;
        candidate.interviewDate = new Date(interviewDate);
        candidate.interviewTime = interviewTime;

        await candidate.save();

        res.json({ msg: 'Invitation sent successfully and status updated' });
    } catch (err) {
        console.error('Error sending invite:', err);
        res.status(500).json({ msg: 'Failed to send invitation' });
    }
});

module.exports = router;
