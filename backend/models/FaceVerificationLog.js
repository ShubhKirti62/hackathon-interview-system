const mongoose = require('mongoose');

const FaceVerificationLogSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
    verificationType: {
        type: String,
        enum: ['registration', 'verification', 'mismatch'],
        required: true
    },
    distance: { type: Number }, // Euclidean distance between face descriptors
    verified: { type: Boolean },
    mismatchCount: { type: Number, default: 0 },
    hrNotified: { type: Boolean, default: false },
    hrNotifiedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
}, { timestamps: true });

// Index for efficient querying
FaceVerificationLogSchema.index({ candidateId: 1, createdAt: -1 });
FaceVerificationLogSchema.index({ interviewId: 1 });

module.exports = mongoose.model('FaceVerificationLog', FaceVerificationLogSchema);
