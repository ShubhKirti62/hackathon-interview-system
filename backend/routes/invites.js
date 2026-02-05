const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Candidate = require('../models/Candidate');
const Invite = require('../models/Invite');
const Questionnaire = require('../models/Questionnaire');
const { sendInterviewInvite } = require('../utils/emailService');
const auth = require('../middleware/auth');

// TC_QNR_02: Generate unique invite link for questionnaire
// @route   POST /api/invites/generate
// @desc    Generate a unique interview invite link
// @access  Private (Admin)
router.post('/generate', auth, async (req, res) => {
    try {
        const { candidateId, questionnaireId, round, domain, expiresInHours = 72 } = req.body;

        if (!candidateId || !round || !domain) {
            return res.status(400).json({ msg: 'candidateId, round, and domain are required' });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ msg: 'Candidate not found' });
        }

        // Validate questionnaire if provided
        if (questionnaireId) {
            const questionnaire = await Questionnaire.findById(questionnaireId);
            if (!questionnaire) {
                return res.status(404).json({ msg: 'Questionnaire not found' });
            }
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

        // Create invite
        const invite = new Invite({
            candidateId,
            questionnaireId,
            round,
            domain,
            token,
            expiresAt,
            createdBy: req.user.id
        });

        await invite.save();

        // Generate invite URL
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteUrl = `${baseUrl}/interview/invite/${token}`;

        res.status(201).json({
            msg: 'Invite link generated successfully',
            invite: {
                id: invite._id,
                token,
                inviteUrl,
                expiresAt,
                candidateName: candidate.name,
                candidateEmail: candidate.email
            }
        });
    } catch (err) {
        console.error('Error generating invite:', err);
        res.status(500).json({ msg: 'Failed to generate invite link' });
    }
});

// TC_INT_01: Validate invite link using unique token
// @route   GET /api/invites/validate/:token
// @desc    Validate an invite token and return invite details
// @access  Public (for candidates)
router.get('/validate/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const invite = await Invite.findOne({ token })
            .populate('candidateId', 'name email domain experienceLevel')
            .populate('questionnaireId', 'title description questions');

        if (!invite) {
            return res.status(404).json({ valid: false, msg: 'Invalid invite link' });
        }

        // Check if expired
        if (new Date() > invite.expiresAt) {
            invite.status = 'Expired';
            await invite.save();
            return res.status(410).json({ valid: false, msg: 'Invite link has expired' });
        }

        // Check if already used
        if (invite.status === 'Used') {
            return res.status(410).json({ valid: false, msg: 'Invite link has already been used' });
        }

        res.json({
            valid: true,
            invite: {
                id: invite._id,
                round: invite.round,
                domain: invite.domain,
                expiresAt: invite.expiresAt,
                status: invite.status,
                candidate: invite.candidateId,
                questionnaire: invite.questionnaireId
            }
        });
    } catch (err) {
        console.error('Error validating invite:', err);
        res.status(500).json({ valid: false, msg: 'Failed to validate invite' });
    }
});

// @route   POST /api/invites/use/:token
// @desc    Mark invite as used when interview starts
// @access  Public (called when candidate starts interview)
router.post('/use/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const invite = await Invite.findOne({ token });

        if (!invite) {
            return res.status(404).json({ msg: 'Invalid invite link' });
        }

        if (invite.status !== 'Pending') {
            return res.status(400).json({ msg: `Invite is already ${invite.status.toLowerCase()}` });
        }

        if (new Date() > invite.expiresAt) {
            invite.status = 'Expired';
            await invite.save();
            return res.status(410).json({ msg: 'Invite link has expired' });
        }

        invite.status = 'Used';
        await invite.save();

        res.json({ msg: 'Invite marked as used', candidateId: invite.candidateId });
    } catch (err) {
        console.error('Error using invite:', err);
        res.status(500).json({ msg: 'Failed to use invite' });
    }
});

// @route   GET /api/invites
// @desc    List all invites (Admin only)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    try {
        const { status, candidateId } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (candidateId) filter.candidateId = candidateId;

        const invites = await Invite.find(filter)
            .populate('candidateId', 'name email')
            .populate('questionnaireId', 'title')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(invites);
    } catch (err) {
        console.error('Error fetching invites:', err);
        res.status(500).json({ msg: 'Failed to fetch invites' });
    }
});

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
