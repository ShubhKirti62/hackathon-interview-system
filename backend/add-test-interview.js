const mongoose = require('mongoose');
const Interview = require('./models/Interview');
const Candidate = require('./models/Candidate');
const Question = require('./models/Question');
require('dotenv').config();

async function addTestInterview() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Find or create a test candidate
        let candidate = await Candidate.findOne({ email: 'test.candidate@example.com' });
        if (!candidate) {
            candidate = new Candidate({
                name: 'Test Candidate',
                email: 'test.candidate@example.com',
                domain: 'Frontend',
                experienceLevel: '1-2 years',
                status: 'Interviewed'
            });
            await candidate.save();
            console.log('Created test candidate');
        }

        // Find or create test questions
        let questions = await Question.find({ domain: 'Frontend' }).limit(3);
        if (questions.length === 0) {
            // Create some test questions if none exist
            const testQuestions = [
                {
                    text: "What is React and how does it work?",
                    type: "Descriptive",
                    domain: "Frontend",
                    experienceLevel: "1-2 years",
                    difficulty: "Easy",
                    keywords: ["React", "components", "state", "props"]
                },
                {
                    text: "Explain the concept of Virtual DOM in React.",
                    type: "Descriptive", 
                    domain: "Frontend",
                    experienceLevel: "1-2 years",
                    difficulty: "Medium",
                    keywords: ["Virtual DOM", "performance", "diffing", "optimization"]
                },
                {
                    text: "Describe the difference between state and props in React.",
                    type: "Descriptive",
                    domain: "Frontend", 
                    experienceLevel: "1-2 years",
                    difficulty: "Easy",
                    keywords: ["state", "props", "immutable", "mutable"]
                }
            ];
            
            questions = await Question.insertMany(testQuestions);
            console.log('Created test questions');
        }

        // Create a test interview with responses
        const testInterview = new Interview({
            candidateId: candidate._id,
            domain: 'Frontend',
            round: 'Technical',
            questions: questions.map(q => q._id),
            status: 'Completed',
            completedAt: new Date(),
            responses: [
                {
                    questionId: questions[0]._id,
                    userResponseText: "React is a JavaScript library for building user interfaces. It works by creating reusable components that manage their own state and props. React uses a virtual DOM to efficiently update the UI by only changing what has actually changed.",
                    timeTakenSeconds: 120,
                    aiFeedback: "Excellent answer covering all key concepts: React, components, state, props, and Virtual DOM.",
                    score: 9
                },
                {
                    questionId: questions[1]._id,
                    userResponseText: "The Virtual DOM is a lightweight JavaScript representation of the actual DOM. React uses it for performance optimization by comparing the new virtual DOM tree with the previous one and only updating the parts that have changed. This process is called diffing.",
                    timeTakenSeconds: 90,
                    aiFeedback: "Good answer explaining Virtual DOM and diffing process.",
                    score: 8
                },
                {
                    questionId: questions[2]._id,
                    userResponseText: "State is mutable and managed within a component, while props are immutable and passed from parent to child components. State can be changed using setState, but props cannot be changed by the receiving component.",
                    timeTakenSeconds: 60,
                    aiFeedback: "Correct explanation of state vs props with key differences.",
                    score: 8
                }
            ],
            feedback: {
                communication: 8,
                confidence: 7,
                technical: 8.3,
                remarks: "Strong technical understanding of React concepts."
            },
            aiOverallSummary: "Candidate completed 3 questions with an average score of 8.3/10. Performance was good with solid technical knowledge of React fundamentals including components, state management, Virtual DOM, and props."
        });

        await testInterview.save();
        console.log('Created test interview with responses');

        // Update candidate status
        await Candidate.findByIdAndUpdate(candidate._id, {
            status: 'Interviewed',
            overallScore: 8.3,
            remarks: 'Test interview completed successfully'
        });

        console.log('Test interview data added successfully!');
        console.log(`Interview ID: ${testInterview._id}`);
        console.log(`Candidate ID: ${candidate._id}`);

        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error adding test interview:', error);
        await mongoose.connection.close();
    }
}

addTestInterview();
