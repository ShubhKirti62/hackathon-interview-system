const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const FaceVerificationLog = require('../models/FaceVerificationLog');
const Screenshot = require('../models/Screenshot');

// Threshold for face matching (lower = more strict)
const FACE_MATCH_THRESHOLD = 0.6;
const MAX_MISMATCHES_BEFORE_NOTIFY = 3;

// Calculate Euclidean distance between two face descriptors
function euclideanDistance(descriptor1, descriptor2) {
    if (descriptor1.length !== descriptor2.length) {
        throw new Error('Descriptor lengths do not match');
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
        sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
}

// Register face descriptor for a candidate
router.post('/register', async (req, res) => {
    try {
        const { candidateId, descriptor } = req.body;

        if (!candidateId || !descriptor) {
            return res.status(400).json({ error: 'candidateId and descriptor are required' });
        }

        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({ error: 'Invalid face descriptor. Expected 128-dimensional array.' });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        // Check if face is already registered
        if (candidate.faceDescriptor && candidate.faceDescriptor.length > 0) {
            return res.status(400).json({ error: 'Face already registered for this candidate' });
        }

        // Save face descriptor
        candidate.faceDescriptor = descriptor;
        candidate.faceRegisteredAt = new Date();
        candidate.faceVerificationEnabled = true;
        await candidate.save();

        // Log the registration
        await FaceVerificationLog.create({
            candidateId: candidate._id,
            verificationType: 'registration',
            verified: true,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        });

        res.json({
            success: true,
            message: 'Face registered successfully',
            registeredAt: candidate.faceRegisteredAt,
        });
    } catch (error) {
        console.error('Face registration error:', error);
        res.status(500).json({ error: 'Failed to register face' });
    }
});

// Verify face during interview
router.post('/verify', async (req, res) => {
    try {
        const { candidateId, descriptor, interviewId } = req.body;

        if (!candidateId || !descriptor) {
            return res.status(400).json({ error: 'candidateId and descriptor are required' });
        }

        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({ error: 'Invalid face descriptor. Expected 128-dimensional array.' });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        if (!candidate.faceDescriptor || candidate.faceDescriptor.length === 0) {
            return res.status(400).json({ error: 'No face registered for this candidate' });
        }

        // Calculate distance between stored and current face
        const distance = euclideanDistance(candidate.faceDescriptor, descriptor);
        const verified = distance < FACE_MATCH_THRESHOLD;

        // Get recent mismatch count for this interview
        let mismatchCount = 0;
        if (interviewId) {
            const recentMismatches = await FaceVerificationLog.countDocuments({
                interviewId,
                verificationType: 'mismatch',
                createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Last 30 minutes
            });
            mismatchCount = recentMismatches;
        }

        // Log the verification attempt
        const logEntry = await FaceVerificationLog.create({
            candidateId: candidate._id,
            interviewId,
            verificationType: verified ? 'verification' : 'mismatch',
            distance,
            verified,
            mismatchCount: verified ? 0 : mismatchCount + 1,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        });

        // Check if HR should be notified
        let hrNotified = false;
        if (!verified && mismatchCount + 1 >= MAX_MISMATCHES_BEFORE_NOTIFY) {
            hrNotified = true;
            logEntry.hrNotified = true;
            logEntry.hrNotifiedAt = new Date();
            await logEntry.save();

            // Here you could add notification logic (email, webhook, etc.)
            console.log(`HR ALERT: Multiple face mismatches detected for candidate ${candidateId}`);
        }

        res.json({
            verified,
            distance: Math.round(distance * 1000) / 1000,
            mismatchCount: verified ? 0 : mismatchCount + 1,
            hrNotified,
            threshold: FACE_MATCH_THRESHOLD,
        });
    } catch (error) {
        console.error('Face verification error:', error);
        res.status(500).json({ error: 'Failed to verify face' });
    }
});

// Get face verification status for a candidate
router.get('/status/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;

        const candidate = await Candidate.findById(candidateId).select(
            'faceVerificationEnabled faceRegisteredAt name email'
        );

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const isRegistered = candidate.faceDescriptor && candidate.faceDescriptor.length > 0;

        res.json({
            candidateId: candidate._id,
            name: candidate.name,
            email: candidate.email,
            faceRegistered: isRegistered,
            faceVerificationEnabled: candidate.faceVerificationEnabled,
            registeredAt: candidate.faceRegisteredAt,
        });
    } catch (error) {
        console.error('Face status error:', error);
        res.status(500).json({ error: 'Failed to get face status' });
    }
});

// Get face verification report for an interview session
router.get('/report/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const logs = await FaceVerificationLog.find({ interviewId: sessionId })
            .sort({ createdAt: 1 })
            .populate('candidateId', 'name email');

        const summary = {
            totalVerifications: logs.length,
            successfulVerifications: logs.filter(l => l.verified).length,
            mismatches: logs.filter(l => l.verificationType === 'mismatch').length,
            hrNotified: logs.some(l => l.hrNotified),
            averageDistance: logs.length > 0
                ? Math.round((logs.reduce((sum, l) => sum + (l.distance || 0), 0) / logs.length) * 1000) / 1000
                : 0,
        };

        res.json({
            sessionId,
            summary,
            logs: logs.map(log => ({
                type: log.verificationType,
                verified: log.verified,
                distance: log.distance,
                timestamp: log.createdAt,
                hrNotified: log.hrNotified,
            })),
        });
    } catch (error) {
        console.error('Face report error:', error);
        res.status(500).json({ error: 'Failed to get face report' });
    }
});

// Reset face registration (admin only)
router.delete('/reset/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        candidate.faceDescriptor = undefined;
        candidate.faceRegisteredAt = undefined;
        candidate.faceVerificationEnabled = false;
        await candidate.save();

        res.json({
            success: true,
            message: 'Face registration reset successfully',
        });
    } catch (error) {
        console.error('Face reset error:', error);
        res.status(500).json({ error: 'Failed to reset face registration' });
    }
});

// Save screenshot during interview (to database)
router.post('/screenshot', async (req, res) => {
    try {
        const { candidateId, image, type } = req.body;

        if (!candidateId || !image) {
            return res.status(400).json({ error: 'candidateId and image are required' });
        }

        // Save to database
        const screenshot = await Screenshot.create({
            candidateId: String(candidateId),
            image,
            type: type || 'video',
            timestamp: new Date(),
        });

        console.log(`Screenshot saved to DB for candidate: ${candidateId}, type: ${type || 'video'}`);

        res.json({
            success: true,
            id: screenshot._id,
            timestamp: screenshot.timestamp,
            type: screenshot.type,
        });
    } catch (error) {
        console.error('Screenshot save error:', error);
        res.status(500).json({ error: 'Failed to save screenshot' });
    }
});

// Get all screenshots for a candidate
router.get('/screenshots/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;

        const screenshots = await Screenshot.find({ candidateId })
            .sort({ timestamp: 1 })
            .select('_id timestamp createdAt');

        res.json({ screenshots });
    } catch (error) {
        console.error('Get screenshots error:', error);
        res.status(500).json({ error: 'Failed to get screenshots' });
    }
});

// Get single screenshot by ID
router.get('/screenshot/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const screenshot = await Screenshot.findById(id);

        if (!screenshot) {
            return res.status(404).json({ error: 'Screenshot not found' });
        }

        res.json(screenshot);
    } catch (error) {
        console.error('Get screenshot error:', error);
        res.status(500).json({ error: 'Failed to get screenshot' });
    }
});

module.exports = router;
