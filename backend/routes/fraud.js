const express = require('express');
const router = express.Router();
const FraudAlert = require('../models/FraudAlert');
const Candidate = require('../models/Candidate');

// GET /api/fraud/alerts - List alerts with filters
router.get('/alerts', async (req, res) => {
    try {
        const { status, alertType, severity, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (alertType) filter.alertType = alertType;
        if (severity) filter.severity = severity;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [alerts, total] = await Promise.all([
            FraudAlert.find(filter)
                .populate('candidateId', 'name email phone domain status')
                .populate('matchedCandidateId', 'name email phone domain status')
                .populate('reviewedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            FraudAlert.countDocuments(filter)
        ]);

        res.json({ alerts, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Fetch fraud alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch fraud alerts' });
    }
});

// GET /api/fraud/stats - Summary counts
router.get('/stats', async (req, res) => {
    try {
        const [total, pending, byType, bySeverity] = await Promise.all([
            FraudAlert.countDocuments(),
            FraudAlert.countDocuments({ status: 'pending' }),
            FraudAlert.aggregate([
                { $group: { _id: '$alertType', count: { $sum: 1 } } }
            ]),
            FraudAlert.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ])
        ]);

        const byTypeMap = {};
        byType.forEach(t => { byTypeMap[t._id] = t.count; });

        const bySeverityMap = {};
        bySeverity.forEach(s => { bySeverityMap[s._id] = s.count; });

        res.json({
            total,
            pending,
            byType: byTypeMap,
            bySeverity: bySeverityMap
        });
    } catch (error) {
        console.error('Fetch fraud stats error:', error);
        res.status(500).json({ error: 'Failed to fetch fraud stats' });
    }
});

// PATCH /api/fraud/alerts/:id - Review/dismiss/confirm
router.patch('/alerts/:id', async (req, res) => {
    try {
        const { status, reviewNotes, reviewedBy } = req.body;

        if (!['pending', 'reviewed', 'confirmed_fraud', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const alert = await FraudAlert.findById(req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        alert.status = status;
        if (reviewNotes) alert.reviewNotes = reviewNotes;
        if (reviewedBy) alert.reviewedBy = reviewedBy;

        await alert.save();

        // Auto-block candidate on confirmed fraud
        if (status === 'confirmed_fraud' && alert.candidateId) {
            await Candidate.findByIdAndUpdate(alert.candidateId, {
                blocked: true,
                blockedReason: `Fraud confirmed: ${alert.alertType} - ${alert.details?.description || 'Confirmed by admin'}`,
                blockedAt: new Date(),
                status: 'blocked'
            });
        }

        const updated = await FraudAlert.findById(req.params.id)
            .populate('candidateId', 'name email phone domain status')
            .populate('matchedCandidateId', 'name email phone domain status')
            .populate('reviewedBy', 'name email');

        res.json(updated);
    } catch (error) {
        console.error('Update fraud alert error:', error);
        res.status(500).json({ error: 'Failed to update fraud alert' });
    }
});

// DELETE /api/fraud/alerts/:id - Delete alert
router.delete('/alerts/:id', async (req, res) => {
    try {
        const alert = await FraudAlert.findByIdAndDelete(req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Delete fraud alert error:', error);
        res.status(500).json({ error: 'Failed to delete fraud alert' });
    }
});

module.exports = router;
