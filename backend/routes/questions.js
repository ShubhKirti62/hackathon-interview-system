const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const xlsx = require('xlsx');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' }); // Temporary storage for uploaded files

// Add Question
router.post('/', async (req, res) => {
    try {
        const question = new Question(req.body);
        const savedQuestion = await question.save();
        res.status(201).json(savedQuestion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Questions (can filter by domain/experience)
router.get('/', async (req, res) => {
    try {
        const { domain, experienceLevel } = req.query;
        let query = {};
        if (domain) query.domain = domain;
        if (experienceLevel) query.experienceLevel = experienceLevel;

        const questions = await Question.find(query);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Question
router.patch('/:id', async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify Question
router.patch('/:id/verify', async (req, res) => {
    try {
        const { userId } = req.body; // In real app, get from auth middleware
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            { verified: true, verifiedBy: userId },
            { new: true }
        );
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk Upload Questions via Excel
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an Excel file.' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const questionsToSave = [];
        const errors = [];

        data.forEach((row, index) => {
            const {
                'Question Text': text,
                'Domain': domain,
                'Experience Level': experienceLevel,
                'Difficulty': difficulty
            } = row;

            // Basic validation
            if (!text || !domain || !experienceLevel || !difficulty) {
                errors.push(`Row ${index + 2}: Missing required fields.`);
                return;
            }

            const questionData = {
                text,
                domain,
                experienceLevel,
                difficulty,
                type: 'Descriptive'
            };

            questionsToSave.push(questionData);
        });

        if (questionsToSave.length > 0) {
            await Question.insertMany(questionsToSave);
        }

        // Delete temp file
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Successfully uploaded ${questionsToSave.length} questions.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Question
router.delete('/:id', async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
