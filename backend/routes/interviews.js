const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Question = require('../models/Question');

// Start new Interview
router.post('/start', async (req, res) => {
    try {
        const { candidateId, domain, round } = req.body;

        // Logic to select questions could be here or dynamic during interview
        const newInterview = new Interview({
            candidateId,
            domain,
            round,
            status: 'In-Progress'
        });

        const savedInterview = await newInterview.save();
        res.status(201).json(savedInterview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit Answer for a Question
router.post('/:id/response', async (req, res) => {
    try {
        const { questionId, userResponseText, timeTakenSeconds } = req.body;
        const interviewId = req.params.id;

        // Here you would typically call an AI service to get feedback/score
        // For now, we'll mock AI feedback
        const aiFeedback = "Good answer, covered the basics.";

        const updatedInterview = await Interview.findByIdAndUpdate(
            interviewId,
            {
                $push: {
                    responses: {
                        questionId,
                        userResponseText,
                        timeTakenSeconds,
                        aiFeedback
                    }
                }
            },
            { new: true }
        );
        res.json(updatedInterview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Complete Interview
router.post('/:id/complete', async (req, res) => {
    try {
        // Generate final report logic here
        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            { status: 'Completed', completedAt: new Date() },
            { new: true }
        );
        res.json(updatedInterview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('candidateId')
            .populate('responses.questionId');
        res.json(interview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
