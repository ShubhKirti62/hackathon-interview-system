const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmailResumeLog = require('../models/EmailResumeLog');
const { scanInbox, startAutoScan, stopAutoScan, getStatus } = require('../services/emailResumeService');

// All routes require admin auth
const adminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin access required' });
        }
        next();
    });
};

// POST /api/email-resume/scan - Trigger manual scan
router.post('/scan', adminAuth, async (req, res) => {
    try {
        const result = await scanInbox(req.user.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/email-resume/status - Get scanner status
router.get('/status', adminAuth, async (req, res) => {
    try {
        const status = getStatus();
        const logCounts = await EmailResumeLog.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const counts = { processed: 0, failed: 0, duplicate: 0 };
        logCounts.forEach(item => {
            counts[item._id] = item.count;
        });
        res.json({ ...status, counts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/email-resume/start - Start auto-polling
router.post('/start', adminAuth, async (req, res) => {
    try {
        const result = startAutoScan();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/email-resume/stop - Stop auto-polling
router.post('/stop', adminAuth, async (req, res) => {
    try {
        const result = stopAutoScan();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/email-resume/logs - Get processed email logs
router.get('/logs', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            EmailResumeLog.find()
                .populate('candidateId', 'name email status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            EmailResumeLog.countDocuments()
        ]);

        res.json({ logs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/email-resume/logs - Clear all logs
router.delete('/logs', adminAuth, async (req, res) => {
    try {
        const result = await EmailResumeLog.deleteMany({});
        res.json({ message: `Deleted ${result.deletedCount} logs` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/email-resume/logs/:id - Delete a log entry
router.delete('/logs/:id', adminAuth, async (req, res) => {
    try {
        const log = await EmailResumeLog.findByIdAndDelete(req.params.id);
        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }
        res.json({ message: 'Log deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/email-resume/logs - Manually add a log entry
router.post('/logs', adminAuth, async (req, res) => {
    try {
        const { from, subject, attachmentName, status, errorMessage } = req.body;
        const log = await EmailResumeLog.create({
            messageId: `manual-${Date.now()}`,
            from: from || '',
            subject: subject || '',
            attachmentName: attachmentName || '',
            status: status || 'processed',
            errorMessage: errorMessage || ''
        });
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
