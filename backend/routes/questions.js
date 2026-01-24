const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

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

module.exports = router;
