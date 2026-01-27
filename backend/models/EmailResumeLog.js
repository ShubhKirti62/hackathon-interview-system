const mongoose = require('mongoose');

const EmailResumeLogSchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    uid: { type: Number },
    from: { type: String },
    subject: { type: String },
    attachmentName: { type: String },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    status: {
        type: String,
        enum: ['processed', 'failed', 'duplicate'],
        default: 'processed'
    },
    errorMessage: { type: String },
    processedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('EmailResumeLog', EmailResumeLogSchema);
