const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const FraudAlert = require('../models/FraudAlert');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

// Dice coefficient for name similarity
function nameSimilarity(a, b) {
    const bigrams = (str) => {
        const set = new Set();
        for (let i = 0; i < str.length - 1; i++) {
            set.add(str.slice(i, i + 2));
        }
        return set;
    };
    const s1 = bigrams(a.toLowerCase());
    const s2 = bigrams(b.toLowerCase());
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    return (2 * intersection.size) / (s1.size + s2.size);
}

// Configure Multer for memory storage (standard for GridFS uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadMemory = upload; // For consistency with previous names

const { uploadFile, getBucket } = require('../utils/gridfs');
const { ObjectId } = require('mongodb');

const { parseResume } = require('../utils/resumeParser');

// Parse Resume Route (For filling the form)
// Uses memory storage to avoid cluttering disk with temp files
router.post('/parse-resume', uploadMemory.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }
        // Validate MIME type or Extension
        const validExtensions = ['.pdf', '.doc', '.docx'];
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        if (!validExtensions.includes(fileExt)) {
            return res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX are allowed.' });
        }

        const parsedData = await parseResume(req.file.buffer, req.file.originalname);
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
            finalResumeUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
        } else if (existingResumePath && existingResumePath.includes('uploads/resumes')) {
            // Migration handling: if it was a local file, we might want to keep the link for now
            // or we just let it be. For new ones, it will be GridFS.
            finalResumeUrl = existingResumePath;
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
            internalReferred: internalReferred === 'true' || internalReferred === true,
            createdBy: req.user.id,
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

// GET ROUTES

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

// Get All Candidates (Filtered by Creator, but Admins see all)
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        
        // If user is admin, show all candidates
        if (req.user.role === 'admin') {
            // No filtering - admins can see all candidates
            console.log(`Admin ${req.user.name} accessing all candidates`);
        } else {
            // Non-admin users only see candidates they created or handle
            query = {
                $or: [
                    { createdBy: req.user.id },
                    { handledBy: req.user.id }
                ]
            };
            console.log(`User ${req.user.name} (${req.user.role}) accessing filtered candidates`);
        }
        
        const candidates = await Candidate.find(query)
            .populate('handledBy', 'name email role')
            .sort({ internalReferred: -1, createdAt: -1 });
            
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Candidate
router.get('/:id', auth, async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('handledBy', 'name email role');
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resume Service Route
router.get('/resume/:id', async (req, res) => {
    try {
        const bucket = getBucket();
        if (!bucket) return res.status(500).json({ error: 'Database bucket not initialized' });

        const fileId = new ObjectId(req.params.id);
        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'Resume file not found' });
        }

        const file = files[0];
        res.set('Content-Type', file.contentType || 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);

        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error fetching resume from GridFS:', error);
        res.status(500).json({ error: 'Failed to retrieve resume' });
    }
});

// PATCH ROUTES

// Update Candidate Status (Shortlist/Reject)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status, remarks } = req.body;
        if (!status) return res.status(400).json({ error: 'Status is required' });

        // Normalize status: "Profile Submitted" -> "profile_submitted"
        const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');

        // Allowed statuses from Candidate model enum
        const allowedStatuses = [
            'profile_submitted',
            'interview_1st_round_pending',
            '1st_round_completed',
            '2nd_round_qualified',
            'rejected',
            'blocked',
            'slot_booked',
            'interviewed',
            'round_2_completed',
            'offer_letter_sent'
        ];

        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${allowedStatuses.join(', ')}` });
        }

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            {
                status: normalizedStatus,
                remarks,
                handledBy: req.user.id,
                handledAt: new Date()
            },
            { new: true, runValidators: true }
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

// DELETE ROUTES

// Delete All Candidates
router.delete('/delete-all', auth, async (req, res) => {
    try {
        await Candidate.deleteMany({});
        res.json({ message: 'All candidates deleted successfully' });
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

module.exports = router;
