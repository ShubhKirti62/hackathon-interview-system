const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const multer = require('multer');
const path = require('path');

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
        // Validate MIME type
        if (req.file.mimetype !== 'application/pdf') {
            console.warn('Invalid file type:', req.file.mimetype);
            return res.status(400).json({ error: 'Uploaded file must be a PDF' });
        }
        // Debug logging
        console.log('Received PDF file:', {
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        const parsedData = await parseResume(req.file.buffer);

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
router.post('/', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, phone, experienceLevel, domain, internalReferred, resumeUrl: existingResumePath, resumeText } = req.body;
        let finalResumeUrl = existingResumePath || '';

        if (req.file) {
            finalResumeUrl = req.file.path;
        }

        const newCandidate = new Candidate({
            name,
            email,
            phone,
            resumeUrl: finalResumeUrl,
            resumeText: resumeText || '', // Can be passed from frontend if parsed
            experienceLevel,
            domain,
            internalReferred: internalReferred === 'true' // Handle multipart/form-data string conversion
        });

        const savedCandidate = await newCandidate.save();
        res.status(201).json(savedCandidate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Candidates
router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find().sort({ createdAt: -1 });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
