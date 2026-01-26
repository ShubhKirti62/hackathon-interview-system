const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Question = require('../models/Question');

// Start new Interview
router.post('/start', async (req, res) => {
    try {
        const { candidateId, domain, round } = req.body;
        const Candidate = require('../models/Candidate');

        // 1. Get candidate details to match experience level
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });



        // 2. Find all question IDs this candidate has already seen in previous interviews
        const previousInterviews = await Interview.find({ candidateId });
        const seenQuestionIds = previousInterviews.reduce((acc, interview) => {
            return acc.concat(interview.questions.map(q => q.toString()));
        }, []);

        const experienceLevel = candidate.experienceLevel;

        // 3. Select a mix of random questions excluding seen ones
        // If we run out of new questions, we'll allow repeats (fallback)
        const getQuestions = async (type, size) => {
            let matchStage = {
                domain,
                type,
                experienceLevel: { $in: [experienceLevel, 'All'] },
                _id: { $nin: seenQuestionIds.map(id => new require('mongoose').Types.ObjectId(id)) }
            };

            let questions = await Question.aggregate([
                { $match: matchStage },
                { $sample: { size } }
            ]);

            // Fallback: If not enough new questions, relax the seen filter
            if (questions.length < size) {
                delete matchStage._id;
                questions = await Question.aggregate([
                    { $match: matchStage },
                    { $sample: { size } }
                ]);
            }
            return questions;
        };

        const mcqs = await getQuestions('MCQ', 2);
        const descriptive = await getQuestions('Descriptive', 3);

        let questions = [...mcqs, ...descriptive];

        // Shuffle the mixed questions
        questions = questions.sort(() => Math.random() - 0.5);

        const newInterview = new Interview({
            candidateId,
            domain,
            round,
            questions: questions.map(q => q._id),
            status: 'In-Progress'
        });

        const savedInterview = await newInterview.save();
        res.status(201).json(savedInterview);
    } catch (error) {
        console.error('Start Interview Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Interview State (Persistence for refresh/net issues)
router.patch('/:id/state', async (req, res) => {
    try {
        const { currentQuestionIndex, remainingTime } = req.body;
        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            { currentQuestionIndex, remainingTime },
            { new: true }
        );
        res.json(updatedInterview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { evaluateAnswer, generateInterviewSummary } = require('../utils/aiService');

// Submit Answer for a Question
router.post('/:id/response', async (req, res) => {
    try {
        const { questionId, userResponseText, timeTakenSeconds } = req.body;
        const interviewId = req.params.id;

        // Fetch the question to get text and keywords
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        // Evaluate using Hybrid AI
        const evaluation = await evaluateAnswer(
            question.text, 
            userResponseText, 
            question.keywords || [], 
            question.difficulty
        );

        const updatedInterview = await Interview.findByIdAndUpdate(
            interviewId,
            {
                $push: {
                    responses: {
                        questionId,
                        userResponseText,
                        timeTakenSeconds,
                        aiFeedback: evaluation.feedback,
                        score: evaluation.score
                    }
                }
            },
            { new: true }
        );
        res.json(updatedInterview);
    } catch (error) {
        console.error("Response Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const scoringWeights = require('../config/scoringWeights');
const Candidate = require('../models/Candidate');

// Complete Interview
router.post('/:id/complete', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('candidateId')
            .populate('responses'); // Ensure responses are populated if strictly needed, but text is in main doc
        
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const candidate = interview.candidateId;

        // 1. Calculate Average Score from Responses
        let totalScore = 0;
        let answeredCount = 0;
        interview.responses.forEach(r => {
            if (r.score !== undefined) {
                totalScore += r.score;
                answeredCount++;
            }
        });

        const finalScore = answeredCount > 0 ? (totalScore / answeredCount).toFixed(1) : 0;

        // 2. Generate AI Summary
        const aiSummary = await generateInterviewSummary(interview);

        // Update Candidate with final score
        await Candidate.findByIdAndUpdate(candidate._id, {
            status: 'Interviewed',
            overallScore: finalScore,
            // We can add detailed AI summary to remarks or a new field if needed
            remarks: `AI Eval: ${finalScore}/10. ${aiSummary.substring(0, 100)}...`
        });

        // Update Interview
        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Completed',
                completedAt: new Date(),
                aiOverallSummary: aiSummary,
                feedback: {
                    remarks: 'Automated Hybrid AI Grading Complete',
                    technical: parseFloat(finalScore) // Store raw score as technical score
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
            .populate('questions')
            .populate('responses.questionId');
        res.json(interview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
