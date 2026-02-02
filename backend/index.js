const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const environment = process.env.NODE_ENV || 'development';
if (environment === 'development') {
    dotenv.config();
} else {
    dotenv.config({ path: `.env.${environment}` });
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon_db';

// Middleware
app.use(cors());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '10mb' })); // Increased limit for face descriptors

// Database Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/questionnaires', require('./routes/questionnaires'));
app.use('/api/invites', require('./routes/invites'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/face', require('./routes/face'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/email-resume', require('./routes/emailResume'));
app.use('/api/fraud', require('./routes/fraud'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Make uploads folder static to serve resume files
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads/resumes directory');
}

// Cleanup MCQ questions, HR users, and candidate handledBy references on server startup
const Question = require('./models/Question');
const User = require('./models/User');
const Candidate = require('./models/Candidate');

async function cleanupMCQs() {
    try {
        const mcqQuestions = await Question.find({ type: 'MCQ' });
        if (mcqQuestions.length > 0) {
            console.log(`Found ${mcqQuestions.length} MCQ questions to delete`);
            const deleteResult = await Question.deleteMany({ type: 'MCQ' });
            console.log(`Deleted ${deleteResult.deletedCount} MCQ questions`);
        }
        
        const descriptiveCount = await Question.countDocuments({ type: 'Descriptive' });
        console.log(`Remaining descriptive questions: ${descriptiveCount}`);
    } catch (error) {
        console.error('Error during MCQ cleanup:', error);
    }
}

async function cleanupHR() {
    try {
        // Delete HR users
        const hrUsers = await User.find({ role: 'hr' });
        if (hrUsers.length > 0) {
            console.log(`Found ${hrUsers.length} HR users to delete`);
            const deleteResult = await User.deleteMany({ role: 'hr' });
            console.log(`Deleted ${deleteResult.deletedCount} HR users`);
        }

        // Update interviewer users to candidate role
        const interviewerUsers = await User.find({ role: 'interviewer' });
        if (interviewerUsers.length > 0) {
            console.log(`Found ${interviewerUsers.length} interviewer users to update to candidate role`);
            const updateResult = await User.updateMany(
                { role: 'interviewer' },
                { $set: { role: 'candidate' } }
            );
            console.log(`Updated ${updateResult.modifiedCount} interviewer users to candidate role`);
        }

        const adminCount = await User.countDocuments({ role: 'admin' });
        const candidateCount = await User.countDocuments({ role: 'candidate' });
        console.log(`User counts - Admin: ${adminCount}, Candidate: ${candidateCount}`);
    } catch (error) {
        console.error('Error during HR cleanup:', error);
    }
}

async function cleanupCandidateHandledBy() {
    try {
        // Find candidates with handledBy references to HR users
        const hrUsers = await User.find({ role: 'hr' });
        if (hrUsers.length > 0) {
            const hrUserIds = hrUsers.map(hr => hr._id);
            const candidatesHandledByHR = await Candidate.find({ handledBy: { $in: hrUserIds } });
            
            if (candidatesHandledByHR.length > 0) {
                await Candidate.updateMany(
                    { handledBy: { $in: hrUserIds } },
                    { $unset: { handledBy: 1, handledAt: 1 } }
                );
                console.log(`Removed HR handledBy references from ${candidatesHandledByHR.length} candidates`);
            }
        }
    } catch (error) {
        console.error('Error during candidate handledBy cleanup:', error);
    }
}

// Start Server
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        cleanupMCQs(); // Run cleanup after connecting
        cleanupHR(); // Run HR cleanup after connecting
        cleanupCandidateHandledBy(); // Run candidate handledBy cleanup after connecting
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database connection error:', error);
    });
