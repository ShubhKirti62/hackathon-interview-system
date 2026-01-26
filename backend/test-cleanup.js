const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function testCleanup() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Check current questions
        const allQuestions = await Question.find({});
        console.log(`Total questions in database: ${allQuestions.length}`);

        const mcqQuestions = await Question.find({ type: 'MCQ' });
        console.log(`MCQ questions found: ${mcqQuestions.length}`);

        const descriptiveQuestions = await Question.find({ type: 'Descriptive' });
        console.log(`Descriptive questions found: ${descriptiveQuestions.length}`);

        if (mcqQuestions.length > 0) {
            console.log('Deleting MCQ questions...');
            const deleteResult = await Question.deleteMany({ type: 'MCQ' });
            console.log(`Deleted ${deleteResult.deletedCount} MCQ questions`);
        }

        // Final check
        const finalQuestions = await Question.find({});
        console.log(`Final total questions: ${finalQuestions.length}`);

        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testCleanup();
