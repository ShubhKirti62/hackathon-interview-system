const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const FraudAlert = require('../models/FraudAlert');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

// Dice coefficient for name similarity
function nameSimilarity(a, b) {
    a = a.toLowerCase().trim();
    b = b.toLowerCase().trim();
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const bigrams = (str) => {
        const set = new Map();
        for (let i = 0; i < str.length - 1; i++) {
            const bi = str.substring(i, i + 2);
            set.set(bi, (set.get(bi) || 0) + 1);
        }
        return set;
    };
    const aBi = bigrams(a);
    const bBi = bigrams(b);
    let intersection = 0;
    for (const [bi, count] of aBi) {
        if (bBi.has(bi)) intersection += Math.min(count, bBi.get(bi));
    }
    return (2 * intersection) / (a.length - 1 + b.length - 1);
}

// Configure Multer for resume uploads
// Configure Multer for resume uploads (Disk Storage for persistence)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Configure Multer for memory storage (for direct parsing without saving)
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

const upload = multer({ storage: storage });

const { parseResume } = require('../utils/resumeParser');

// Parse Resume Route (For filling the form)
// Uses memory storage to avoid cluttering disk with temp files
router.post('/parse-resume', uploadMemory.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }
        // Validate MIME type or Extension
        const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        const allowedExtensions = ['.pdf', '.docx', '.doc'];
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        if (!allowedMimes.includes(req.file.mimetype) && !allowedExtensions.includes(fileExt)) {
            console.warn('Warning: Unusual file type/extension:', req.file.mimetype, fileExt);
            // Proceed anyway to see if parser can handle it
        }

        // Debug logging
        console.log('Received file:', {
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        const parsedData = await parseResume(req.file.buffer, req.file.mimetype, req.file.originalname);

        // Return parsed data to frontend
        res.json({
            ...parsedData
            // resumeUrl not applicable for memory storage
        });
    } catch (error) {
        console.error('Resume Parse Error:', error);
        res.status(500).json({ error: error.message || 'Failed to parse resume' });
    }
});

// Create Candidate
router.post('/', upload.single('resume'), auth, async (req, res) => {
    try {
        console.log('CREATE CANDIDATE REQUEST INITIATED');
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { name, email, phone, experienceLevel, domain, internalReferred, resumeUrl: existingResumePath, resumeText } = req.body;
        let finalResumeUrl = existingResumePath || '';

        if (req.file) {
            finalResumeUrl = req.file.path;
        }

        // Validate required fields explicitly for debugging
        if (!name || !email || !domain || !experienceLevel) {
            console.error('Missing required fields:', { name, email, domain, experienceLevel });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newCandidate = new Candidate({
            name,
            email,
            phone,
            resumeUrl: finalResumeUrl,
            resumeText: resumeText || '',
            experienceLevel,
            domain,
            internalReferred: internalReferred === 'true',
            handledBy: req.user.id, // Set to current admin user
            handledAt: new Date()
        });

        console.log('Saving candidate to DB...');
        const savedCandidate = await newCandidate.save();
        console.log('Candidate saved successfully:', savedCandidate._id);

        // Non-blocking fraud detection after save
        (async () => {
            try {
                // Check phone duplicates
                if (phone) {
                    const phoneDuplicates = await Candidate.find({
                        phone: phone,
                        _id: { $ne: savedCandidate._id }
                    }).select('name email phone');

                    for (const dup of phoneDuplicates) {
                        await FraudAlert.create({
                            candidateId: savedCandidate._id,
                            matchedCandidateId: dup._id,
                            alertType: 'duplicate_phone',
                            severity: 'high',
                            details: {
                                phoneMatch: phone,
                                matchedName: dup.name,
                                matchedEmail: dup.email,
                                description: `Same phone number "${phone}" used by ${dup.name} (${dup.email})`
                            }
                        });
                        console.log(`FRAUD ALERT: Duplicate phone detected for candidate ${savedCandidate._id}`);
                    }
                }

                // Check name similarity
                const allCandidates = await Candidate.find({
                    _id: { $ne: savedCandidate._id }
                }).select('name email phone');

                for (const other of allCandidates) {
                    const similarity = nameSimilarity(name, other.name);
                    if (similarity > 0.85) {
                        await FraudAlert.create({
                            candidateId: savedCandidate._id,
                            matchedCandidateId: other._id,
                            alertType: 'duplicate_name',
                            severity: 'medium',
                            details: {
                                nameSimilarity: Math.round(similarity * 100) / 100,
                                matchedName: other.name,
                                matchedEmail: other.email,
                                description: `Name "${name}" is ${Math.round(similarity * 100)}% similar to "${other.name}" (${other.email})`
                            }
                        });
                        console.log(`FRAUD ALERT: Similar name detected for candidate ${savedCandidate._id}`);
                    }
                }
            } catch (fraudErr) {
                console.error('Fraud detection error (non-blocking):', fraudErr);
            }
        })();

        res.status(201).json(savedCandidate);
    } catch (error) {
        console.error('Candidate Creation Error:', error);
        // Handle duplicate email specifically
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Get All Candidates
router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find()
            .populate('handledBy', 'name email role')
            .sort({ internalReferred: -1, createdAt: -1 });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Candidate Status (Shortlist/Reject)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status, remarks } = req.body;
        if (!['Shortlisted', 'Rejected', 'Pending', 'Interviewed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            {
                status,
                remarks,
                handledBy: req.user.id,
                handledAt: new Date()
            },
            { new: true }
        ).populate('handledBy', 'name email role');

        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Candidate Details
router.patch('/:id', auth, async (req, res) => {
    try {
        const allowedUpdates = ['name', 'email', 'phone', 'domain', 'experienceLevel', 'internalReferred'];
        const updates = {};

        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Current Candidate Profile & Active Interview
router.get('/me', auth, async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.user.id);
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        const Interview = require('../models/Interview');
        const activeInterview = await Interview.findOne({
            candidateId: req.user.id,
            status: { $ne: 'Completed' }
        }).sort({ createdAt: -1 });

        const Slot = require('../models/Slot');
        const bookedSlot = await Slot.findOne({
            candidateId: req.user.id,
            status: 'Booked'
        }).populate('interviewerId', 'name email');

        res.json({ candidate, activeInterview, bookedSlot });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Candidate
router.delete('/:id', async (req, res) => {
    try {
        await Candidate.findByIdAndDelete(req.params.id);
        res.json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete All Candidates
router.delete('/delete-all', auth, async (req, res) => {
    try {
        await Candidate.deleteMany({});
        res.json({ message: 'All candidates deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
