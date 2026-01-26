const mongoose = require('mongoose');
const Question = require('./models/Question');
const Candidate = require('./models/Candidate');
require('dotenv').config();

async function debugInterviewQuestions() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Check total questions
        const totalQuestions = await Question.countDocuments();
        console.log(`Total questions in database: ${totalQuestions}`);

        // Check descriptive questions
        const descriptiveQuestions = await Question.countDocuments({ type: 'Descriptive' });
        console.log(`Descriptive questions: ${descriptiveQuestions}`);

        // Check MCQ questions (should be 0 after cleanup)
        const mcqQuestions = await Question.countDocuments({ type: 'MCQ' });
        console.log(`MCQ questions: ${mcqQuestions}`);

        // Show some sample questions
        const sampleQuestions = await Question.find({}).limit(5);
        console.log('\nSample questions:');
        sampleQuestions.forEach((q, index) => {
            console.log(`${index + 1}. Type: ${q.type}, Domain: ${q.domain}, Experience: ${q.experienceLevel}`);
            console.log(`   Question: ${q.question.substring(0, 100)}...`);
        });

        // Check candidates
        const candidates = await Candidate.find({}).limit(3);
        console.log('\nSample candidates:');
        candidates.forEach((c, index) => {
            console.log(`${index + 1}. Name: ${c.name}, Domain: ${c.domain}, Experience: ${c.experienceLevel}`);
        });

        // Test the actual query used in interviews
        console.log('\nTesting interview query...');
        const testCandidate = candidates[0];
        if (testCandidate) {
            const testQuery = {
                domain: testCandidate.domain,
                type: 'Descriptive',
                experienceLevel: { $in: [testCandidate.experienceLevel, 'All'] }
            };
            
            const matchingQuestions = await Question.find(testQuery);
            console.log(`Questions matching candidate ${testCandidate.name}: ${matchingQuestions.length}`);
            
            if (matchingQuestions.length > 0) {
                console.log('Sample matching questions:');
                matchingQuestions.slice(0, 3).forEach((q, index) => {
                    console.log(`  ${index + 1}. ${q.question.substring(0, 80)}...`);
                });
            }
        }

        await mongoose.connection.close();
        console.log('\nDebug completed successfully!');

    } catch (error) {
        console.error('Error during debug:', error);
        await mongoose.connection.close();
    }
}

debugInterviewQuestions();
