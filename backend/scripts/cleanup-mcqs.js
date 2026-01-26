const mongoose = require('mongoose');
const Question = require('../models/Question');
require('dotenv').config({ path: '../.env' });

async function cleanupMCQs() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Find all MCQ questions
        const mcqQuestions = await Question.find({ type: 'MCQ' });
        console.log(`Found ${mcqQuestions.length} MCQ questions to delete`);

        // Delete all MCQ questions
        const deleteResult = await Question.deleteMany({ type: 'MCQ' });
        console.log(`Deleted ${deleteResult.deletedCount} MCQ questions`);

        // Verify remaining questions are all descriptive
        const remainingQuestions = await Question.find({});
        console.log(`Remaining questions: ${remainingQuestions.length}`);
        
        const descriptiveCount = await Question.countDocuments({ type: 'Descriptive' });
        console.log(`Descriptive questions: ${descriptiveCount}`);

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        console.log('MCQ cleanup completed successfully!');

    } catch (error) {
        console.error('Error during MCQ cleanup:', error);
        process.exit(1);
    }
}

cleanupMCQs();
