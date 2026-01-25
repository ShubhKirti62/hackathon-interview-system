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
app.use(express.json({ limit: '50mb' })); // Increased limit for screenshots

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

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Make uploads folder static to serve resume files
app.use('/uploads', express.static('uploads'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
