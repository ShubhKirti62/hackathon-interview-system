const express = require('express');
const router = express.Router();
const Questionnaire = require('../models/Questionnaire');

// Create Questionnaire
router.post('/', async (req, res) => {
    try {
        const { title, description, domain, experienceLevel, questions, createdBy } = req.body;
        const newQuestionnaire = new Questionnaire({
            title,
            description,
            domain,
            experienceLevel,
            questions,
            createdBy
        });
        const saved = await newQuestionnaire.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Questionnaires
router.get('/', async (req, res) => {
    try {
        const questionnaires = await Questionnaire.find().populate('questions');
        res.json(questionnaires);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Questionnaire
router.get('/:id', async (req, res) => {
    try {
        const questionnaire = await Questionnaire.findById(req.params.id).populate('questions');
        if (!questionnaire) return res.status(404).json({ msg: 'Questionnaire not found' });
        res.json(questionnaire);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
