const mongoose = require('mongoose');
const Interview = require('./models/Interview');
const Candidate = require('./models/Candidate');
require('dotenv').config();

async function checkInterviewData() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-interview');
        console.log('Connected to MongoDB');

        // Find all interviews
        const interviews = await Interview.find({})
            .populate('candidateId', 'name email')
            .sort({ createdAt: -1 });
        
        console.log(`\nTotal interviews: ${interviews.length}`);
        
        interviews.forEach((interview, index) => {
            console.log(`\n--- Interview ${index + 1} ---`);
            console.log(`ID: ${interview._id}`);
            console.log(`Candidate: ${interview.candidateId?.name || 'Unknown'}`);
            console.log(`Status: ${interview.status}`);
            console.log(`Domain: ${interview.domain}`);
            console.log(`Round: ${interview.round}`);
            console.log(`Questions: ${interview.questions?.length || 0}`);
            console.log(`Responses: ${interview.responses?.length || 0}`);
            console.log(`Completed At: ${interview.completedAt || 'Not completed'}`);
            
            if (interview.responses && interview.responses.length > 0) {
                console.log('\nSample Responses:');
                interview.responses.slice(0, 2).forEach((response, i) => {
                    console.log(`  Response ${i + 1}:`);
                    console.log(`    Question ID: ${response.questionId}`);
                    console.log(`    Has Text: ${!!response.userResponseText}`);
                    console.log(`    Text Length: ${response.userResponseText?.length || 0}`);
                    console.log(`    Score: ${response.score || 'Not scored'}`);
                    console.log(`    Has AI Feedback: ${!!response.aiFeedback}`);
                });
            }
        });

        // Check for a specific candidate if provided
        const candidateId = '69774066ab25bd0922fb2535'; // The candidate from earlier
        const candidateInterviews = interviews.filter(i => 
            i.candidateId && i.candidateId._id.toString() === candidateId
        );
        
        console.log(`\n--- Interviews for candidate ${candidateId} ---`);
        console.log(`Found: ${candidateInterviews.length} interviews`);
        
        candidateInterviews.forEach((interview, index) => {
            console.log(`\nInterview ${index + 1}:`);
            console.log(`Status: ${interview.status}`);
            console.log(`Responses: ${interview.responses?.length || 0}`);
            if (interview.responses?.length > 0) {
                interview.responses.forEach((r, i) => {
                    console.log(`  Response ${i + 1}: ${r.userResponseText?.substring(0, 50) || 'No text'}...`);
                });
            }
        });

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');

    } catch (error) {
        console.error('Error checking interview data:', error);
        await mongoose.connection.close();
    }
}

checkInterviewData();
