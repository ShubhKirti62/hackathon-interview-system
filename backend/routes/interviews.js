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

const scoringWeights = require('../config/scoringWeights');
const Candidate = require('../models/Candidate');

// Complete Interview
router.post('/:id/complete', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id).populate('candidateId');
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const candidate = interview.candidateId;
        const roleKey = candidate.role || (candidate.domain === 'Frontend' ? 'frontend_dev' : 'default');
        const weights = scoringWeights.roles[roleKey] || scoringWeights.roles['default'];

        // Mock AI generating raw metrics (In real app, this comes from LLM analysis of transcript)
        // Generating random scores between 3.0 and 5.0 for demo
        const metrics = {
            relevance: (Math.random() * 2 + 3).toFixed(1),
            clarity: (Math.random() * 2 + 3).toFixed(1),
            depth: (Math.random() * 2 + 3).toFixed(1),
            accuracy: (Math.random() * 2 + 3).toFixed(1),
            structure: (Math.random() * 2 + 3).toFixed(1),
            confidence: (Math.random() * 2 + 3).toFixed(1),
            honesty: (Math.random() * 1 + 4).toFixed(1) // Usually high
        };

        // Calculate Weighted Score
        let totalScore = 0;
        let totalWeight = 0;

        for (const [key, value] of Object.entries(metrics)) {
            if (weights[key]) {
                totalScore += parseFloat(value) * weights[key];
                totalWeight += weights[key];
            }
        }

        const finalScore = (totalScore / totalWeight).toFixed(2);

        // Update Candidate with these metrics
        await Candidate.findByIdAndUpdate(candidate._id, {
            status: 'Interviewed',
            evaluationMetrics: metrics,
            overallScore: finalScore
        });

        // Update Interview
        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Completed',
                completedAt: new Date(),
                aiOverallSummary: `Candidate scored ${finalScore}/5.0. Strong in ${parseFloat(metrics.relevance) > 4 ? 'relevance' : 'basics'}.`,
                feedback: {
                    remarks: 'Automated AI Grading Complete',
                    // Store the detailed metrics in feedback or a new field if schema allowed. 
                    // For now, storing in Candidate is key for the "selection" requirement.
                }
            },
            { new: true }
        );

        res.json(updatedInterview);
    } catch (error) {
        console.error('Complete Interview Error:', error);
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
