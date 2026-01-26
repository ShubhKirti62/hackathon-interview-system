const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    resumeUrl: { type: String }, // Path to uploaded resume
    resumeText: { type: String }, // Extracted text from resume
    experienceLevel: {
        type: String,
        enum: ['Fresher/Intern', '1-2 years', '2-4 years', '4-6 years', '6-8 years', '8-10 years'],
        required: true
    },
    domain: { type: String, required: true }, // e.g., 'Frontend', 'Backend'
    role: { type: String }, // specific role e.g., 'frontend_dev', 'sales'
    internalReferred: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: [
            'Profile Submitted', 
            'Interview 1st Round Pending', 
            '1st Round Completed', 
            '2nd Round Qualified', 
            'Rejected',
            'Pending', 'Shortlisted', 'Slot_Booked', 'Interviewed', 'Round_2_Completed' // Keeping old ones temporarily to avoid crash if db has them
        ], 
        default: 'Profile Submitted' 
    },

    // Face Verification Data
    faceDescriptor: { type: [Number] }, // 128-dimensional face descriptor array
    faceRegisteredAt: { type: Date },
    faceVerificationEnabled: { type: Boolean, default: false },

    // Evaluation Metrics from Interview
    evaluationMetrics: {
        relevance: { type: Number, min: 0, max: 5 },
        clarity: { type: Number, min: 0, max: 5 },
        depth: { type: Number, min: 0, max: 5 },
        accuracy: { type: Number, min: 0, max: 5 },
        structure: { type: Number, min: 0, max: 5 },
        confidence: { type: Number, min: 0, max: 5 },
        honesty: { type: Number, min: 0, max: 5 }
    },
    overallScore: { type: Number },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handledAt: { type: Date },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
