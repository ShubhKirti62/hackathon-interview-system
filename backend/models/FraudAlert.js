const mongoose = require('mongoose');

const FraudAlertSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    matchedCandidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
    alertType: {
        type: String,
        enum: ['duplicate_phone', 'duplicate_name', 'face_match', 'proxy_detected', 'face_inconsistency'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    details: {
        faceDistance: { type: Number },
        phoneMatch: { type: String },
        nameSimilarity: { type: Number },
        matchedName: { type: String },
        matchedEmail: { type: String },
        description: { type: String }
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'confirmed_fraud', 'dismissed'],
        default: 'pending'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String }
}, { timestamps: true });

FraudAlertSchema.index({ candidateId: 1 });
FraudAlertSchema.index({ status: 1, createdAt: -1 });
FraudAlertSchema.index({ alertType: 1 });

module.exports = mongoose.model('FraudAlert', FraudAlertSchema);
