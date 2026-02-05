const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    resumeUrl: { type: String }, // Path to uploaded resume
    resumeText: { type: String }, // Extracted text from resume
    experienceLevel: {
        type: String,
        enum: ['Fresher/Intern', '0-1 years', '1-2 years', '2-4 years', '4-6 years', '6-8 years', '8-10 years', '10+ years'],
        required: true
    },
    domain: { type: String, required: true }, // e.g., 'Frontend', 'Backend'
    role: { type: String }, // specific role e.g., 'frontend_dev', 'sales' (business_analyst, marketing)
    internalReferred: { type: Boolean, default: false },

    // Scoring Factors
    noticePeriod: { type: String, default: '' }, // e.g., "30 days", "Immediate", "2 months"
    communicationScore: { type: Number, default: 0 }, // 0-10 derived from interview

    status: {
        type: String,
        enum: [
            'profile_submitted',
            'interview_1st_round_pending',
            '1st_round_completed',
            '2nd_round_qualified',
            'rejected',
            'blocked',
            'slot_booked',
            'interviewed',
            'round_2_completed',
            'offer_letter_sent'
        ],
        default: 'profile_submitted'
    },

    // Face Verification Data
    faceDescriptor: { type: [Number] }, // 128-dimensional face descriptor array
    faceImage: { type: String }, // Path/URL to the registered face image
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
    remarks: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    blocked: { type: Boolean, default: false },
    blockedReason: { type: String },
    blockedAt: { type: Date },

    // Interview Scheduling
    interviewLink: { type: String },
    interviewDate: { type: Date },
    interviewTime: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
