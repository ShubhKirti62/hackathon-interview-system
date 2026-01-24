const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    resumeUrl: { type: String }, // Path to uploaded resume
    experienceLevel: {
        type: String,
        enum: ['Fresher/Intern', '1-2 years', '2-4 years', '4-6 years', '6-8 years', '8-10 years'],
        required: true
    },
    domain: { type: String, required: true }, // e.g., 'Frontend', 'Backend'
    internalReferred: { type: Boolean, default: false },
    status: { type: String, enum: ['Pending', 'Interviewed', 'Shortlisted', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
