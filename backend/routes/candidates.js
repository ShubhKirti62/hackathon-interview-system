const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const multer = require('multer');
const path = require('path');

// Configure Multer for resume uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const { parseResume } = require('../utils/resumeParser');

// Parse Resume Route (For filling the form)
router.post('/parse-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }

        const parsedData = await parseResume(req.file.path);

        // Return parsed data to frontend
        res.json({
            ...parsedData,
            resumeUrl: req.file.path // Send back the path so we can attach it to the candidate creation if needed
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
