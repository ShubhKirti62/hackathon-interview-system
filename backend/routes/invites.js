const express = require('express');
const router = express.Router();
const Invite = require('../models/Invite');
const crypto = require('crypto');

// Generate Invite Link
router.post('/', async (req, res) => {
    try {
        const { candidateId, round, domain, questionnaireId, createdBy } = req.body;

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry

        const newInvite = new Invite({
            candidateId,
            round,
            domain,
            questionnaireId,
            token,
            expiresAt,
            createdBy
        });

        const savedInvite = await newInvite.save();

        // Construct link (in a real app, from env var)
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/interview/intro/${token}`;

        res.status(201).json({ ...savedInvite.toObject(), inviteLink });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Validate Invite Token
router.get('/:token', async (req, res) => {
    try {
        const invite = await Invite.findOne({ token: req.params.token, status: 'Pending' }).populate('candidateId');

        if (!invite) {
            return res.status(404).json({ msg: 'Invalid or expired invite' });
        }

        if (new Date() > invite.expiresAt) {
            invite.status = 'Expired';
            await invite.save();
            return res.status(400).json({ msg: 'Invite has expired' });
        }

        res.json(invite);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
