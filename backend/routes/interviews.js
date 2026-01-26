const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Question = require('../models/Question');
const mongoose = require('mongoose');

// Start new Interview
router.post('/start', async (req, res) => {
    try {
        const { candidateId, domain, round, experienceLevel } = req.body;
        const Candidate = require('../models/Candidate');

        // 1. Get candidate details
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        // Use experience level from request payload, fallback to candidate's experience level
        const targetExperienceLevel = experienceLevel || candidate.experienceLevel;
        console.log(`Starting interview for candidate: ${candidate.name}, Domain: ${domain}, Requested Experience: ${targetExperienceLevel}, Candidate Experience: ${candidate.experienceLevel}`);

        // 2. Find all question IDs this candidate has already seen in previous interviews
        const previousInterviews = await Interview.find({ candidateId });
        const seenQuestionIds = previousInterviews.reduce((acc, interview) => {
            return acc.concat(interview.questions.map(q => q.toString()));
        }, []);

        // 3. Select a mix of random questions excluding seen ones
        // If we run out of new questions, we'll allow repeats (fallback)
        const getQuestions = async (type, size) => {
            let matchStage = {
                domain,
                type,
                experienceLevel: { $in: [targetExperienceLevel, 'All'] }
            };

            console.log(`Query for ${type} questions:`, JSON.stringify(matchStage, null, 2));

            // First try to get all available questions, then randomly sample
            let availableQuestions = await Question.find(matchStage).lean();
            console.log(`Found ${availableQuestions.length} total ${type} questions with experience filter`);

            // If we have seen questions, filter them out
            if (seenQuestionIds.length > 0 && availableQuestions.length > seenQuestionIds.length) {
                availableQuestions = availableQuestions.filter(q => 
                    !seenQuestionIds.includes(q._id.toString())
                );
                console.log(`After filtering seen questions: ${availableQuestions.length} remaining`);
            }

            // If we don't have enough new questions, get all questions (including seen ones)
            if (availableQuestions.length < size) {
                console.log(`Not enough new questions, getting all questions...`);
                availableQuestions = await Question.find(matchStage).lean();
            }

            // Fallback 1: Try without experience level filter
            if (availableQuestions.length < size) {
                console.log(`Not enough ${type} questions, trying without experience filter...`);
                delete matchStage.experienceLevel;
                availableQuestions = await Question.find(matchStage).lean();
                console.log(`Found ${availableQuestions.length} ${type} questions without experience filter`);
            }

            // Fallback 2: Try any descriptive questions for the domain
            if (availableQuestions.length < size) {
                console.log(`Still not enough questions, trying any ${type} questions for domain...`);
                matchStage = {
                    domain,
                    type
                };
                availableQuestions = await Question.find(matchStage).lean();
                console.log(`Found ${availableQuestions.length} ${type} questions for domain only`);
            }

            // Fallback 3: Try any descriptive questions
            if (availableQuestions.length < size) {
                console.log(`Still not enough, trying any ${type} questions...`);
                matchStage = { type };
                availableQuestions = await Question.find(matchStage).lean();
                console.log(`Found ${availableQuestions.length} ${type} questions of any type`);
            }

            // Randomly sample the questions
            const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(size, shuffled.length));
            
            console.log(`Selected ${selected.length} ${type} questions randomly`);
            selected.forEach((q, i) => {
                console.log(`  ${i+1}. ${q.text.substring(0, 50)}...`);
            });

            return selected;
        };

        const descriptive = await getQuestions('Descriptive', 5); // Get 5 descriptive questions instead of 3

        let questions = [...descriptive];

        // Shuffle the mixed questions
        questions = questions.sort(() => Math.random() - 0.5);

        console.log(`Final questions array length: ${questions.length}`);
        if (questions.length === 0) {
            console.log('ERROR: No questions found in database! Creating a default question...');
            
            // Create a default question as last resort
            const defaultQuestion = new Question({
                text: "Please describe your experience with web development and tell us about a project you're proud of.",
                type: "Descriptive",
                domain: domain || "General",
                experienceLevel: "All",
                difficulty: "Easy"
            });
            
            await defaultQuestion.save();
            questions = [defaultQuestion];
            console.log('Created and used default question');
        }

        const newInterview = new Interview({
            candidateId,
            domain,
            round,
            questions: questions.map(q => q._id),
            status: 'In-Progress'
        });

        const savedInterview = await newInterview.save();
        console.log(`Interview created with ${savedInterview.questions.length} questions`);
        res.status(201).json(savedInterview);
    } catch (error) {
        console.error('Start Interview Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Interviews by Candidate
router.get('/', async (req, res) => {
    try {
        const { candidateId } = req.query;
        let filter = {};
        
        if (candidateId) {
            filter.candidateId = candidateId;
        }
        
        const interviews = await Interview.find(filter)
            .populate('candidateId', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(interviews);
    } catch (error) {
        console.error('Get Interviews Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Interview Details with Questions and Answers
router.get('/:id', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('candidateId', 'name email domain experienceLevel')
            .populate('responses.questionId', 'text difficulty keywords')
            .populate('questions', 'text difficulty keywords');
            
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json(interview);
    } catch (error) {
        console.error('Get Interview Error:', error);
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

        // 3. Calculate Weighted Score (New Logic)
        const { calculateCandidateScore } = require('../utils/scoreCalculator');
        
        // Mock communication score if not available from AI yet (random 5-9 for now or use average score)
        // Ideally AI summary would provide this. For now, let's use the technical score as proxy or random for demo
        // In a real implementation, 'evaluateAnswer' would return dimension scores.
        // Let's assume communication correlates with technical score for now to keep it simple, or random variation.
        const communicationScore = Math.min(10, (parseFloat(finalScore) + (Math.random() * 2 - 1))); 

        const scoreResult = calculateCandidateScore(
            candidate,
            parseFloat(finalScore),
            communicationScore,
            candidate.role || 'business_analyst' // Defaulting to BA if undefined for testing
        );

        console.log("Calculated Weighted Score:", scoreResult);

        // Update Candidate with final score
        await Candidate.findByIdAndUpdate(candidate._id, {
            status: 'Interviewed',
            overallScore: scoreResult.finalScore,
            remarks: `Weighted Score: ${scoreResult.finalScore}/10. Breakdown: ${JSON.stringify(scoreResult.breakdown.weighted)}. AI Summary: ${aiSummary.substring(0, 100)}...`
        });

        // Update Interview
        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Completed',
                completedAt: new Date(),
                aiOverallSummary: aiSummary,
                feedback: {
                    remarks: `Weighted Score: ${scoreResult.finalScore}`,
                    technical: parseFloat(finalScore),
                    communication: parseFloat(communicationScore.toFixed(1)),
                    weightedBreakdown: scoreResult.breakdown
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

// Record Tab Violation (Anti-Fraud)
router.post('/:id/violation', async (req, res) => {
    try {
        const { type, duration, questionIndex } = req.body;
        const interviewId = req.params.id;

        const interview = await Interview.findById(interviewId).populate('candidateId');
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Check if already terminated
        if (interview.status === 'Terminated') {
            return res.status(403).json({
                error: 'Interview already terminated',
                terminated: true,
                blocked: true
            });
        }

        // Add the violation
        const violation = {
            type,
            timestamp: new Date(),
            duration,
            questionIndex
        };

        const updatedInterview = await Interview.findByIdAndUpdate(
            interviewId,
            {
                $push: { tabViolations: violation },
                $inc: { totalViolations: 1 },
                // Auto-flag for review if more than 3 violations
                ...(interview.totalViolations >= 2 ? { flaggedForReview: true } : {})
            },
            { new: true }
        );

        // Return warning level
        const totalViolations = updatedInterview.totalViolations;
        let warningLevel = 'low';
        if (totalViolations >= 5) warningLevel = 'critical';
        else if (totalViolations >= 3) warningLevel = 'high';
        else if (totalViolations >= 2) warningLevel = 'medium';

        // If critical (5 violations), terminate interview and block candidate
        if (totalViolations >= 5) {
            // Terminate the interview
            await Interview.findByIdAndUpdate(interviewId, {
                status: 'Terminated',
                terminatedReason: 'Maximum tab violations reached (5/5)',
                completedAt: new Date()
            });

            // Block the candidate from logging in again
            if (interview.candidateId) {
                const candidateId = interview.candidateId._id || interview.candidateId;
                await Candidate.findByIdAndUpdate(candidateId, {
                    blocked: true,
                    blockedReason: 'Interview terminated due to excessive tab violations',
                    blockedAt: new Date(),
                    status: 'Rejected'
                });
            }

            return res.json({
                recorded: true,
                totalViolations,
                warningLevel: 'critical',
                flaggedForReview: true,
                terminated: true,
                blocked: true,
                message: 'Interview terminated due to excessive violations. You have been blocked from further interviews.'
            });
        }

        res.json({
            recorded: true,
            totalViolations,
            warningLevel,
            flaggedForReview: updatedInterview.flaggedForReview,
            terminated: false,
            blocked: false,
            message: totalViolations >= 3
                ? 'Warning: Continued violations may affect your evaluation.'
                : 'Violation recorded.'
        });
    } catch (error) {
        console.error('Record Violation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
