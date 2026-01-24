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

// Create Candidate
router.post('/', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, phone, experienceLevel, domain, internalReferred } = req.body;
        let resumeUrl = '';

        if (req.file) {
            resumeUrl = req.file.path;
        }

        const newCandidate = new Candidate({
            name,
            email,
            phone,
            resumeUrl,
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
