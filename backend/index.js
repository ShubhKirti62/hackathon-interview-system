const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

const environment = process.env.NODE_ENV || 'development';
if (environment === 'development') {
    dotenv.config();
} else {
    dotenv.config({ path: `.env.${environment}` });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

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

// Make uploads folder static to serve any other static files if needed
app.use('/uploads', express.static('uploads'));

// WebRTC Signaling Server
const rooms = new Map(); // roomId -> Set of socket ids

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join a meeting room
    socket.on('join-room', ({ roomId, userId, userName, role }) => {
        console.log(`User ${userName} (${role}) joining room ${roomId}`);

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;
        socket.userName = userName;
        socket.userRole = role;

        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
            socketId: socket.id,
            userId,
            userName,
            role
        });

        // Send list of existing users to the new user
        const existingUsers = [];
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
            roomSockets.forEach(socketId => {
                if (socketId !== socket.id) {
                    const s = io.sockets.sockets.get(socketId);
                    if (s) {
                        existingUsers.push({
                            socketId: s.id,
                            userId: s.userId,
                            userName: s.userName,
                            role: s.userRole
                        });
                    }
                }
            });
        }
        socket.emit('existing-users', existingUsers);
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ to, offer }) => {
        console.log(`Offer from ${socket.id} to ${to}`);
        io.to(to).emit('offer', {
            from: socket.id,
            offer,
            userName: socket.userName,
            role: socket.userRole
        });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ to, answer }) => {
        console.log(`Answer from ${socket.id} to ${to}`);
        io.to(to).emit('answer', {
            from: socket.id,
            answer
        });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ to, candidate }) => {
        io.to(to).emit('ice-candidate', {
            from: socket.id,
            candidate
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        if (socket.roomId) {
            const room = rooms.get(socket.roomId);
            if (room) {
                room.delete(socket.id);
                if (room.size === 0) {
                    rooms.delete(socket.roomId);
                }
            }
            socket.to(socket.roomId).emit('user-left', {
                socketId: socket.id,
                userId: socket.userId,
                userName: socket.userName
            });
        }
    });
});

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

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`WebSocket signaling server ready`);
        });
    })
    .catch((error) => {
        console.error('Database connection error:', error);
    });
