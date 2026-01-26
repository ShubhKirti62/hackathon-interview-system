const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['Available', 'Booked', 'Completed'], default: 'Available' },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    meetingLink: { type: String },
    interviewerFeedback: {
        score: { type: Number, min: 0, max: 10 },
        remarks: { type: String },
        metrics: {
            relevance: { type: Number, min: 0, max: 5 },
            clarity: { type: Number, min: 0, max: 5 },
            depth: { type: Number, min: 0, max: 5 },
            accuracy: { type: Number, min: 0, max: 5 },
            structure: { type: Number, min: 0, max: 5 },
            confidence: { type: Number, min: 0, max: 5 },
            honesty: { type: Number, min: 0, max: 5 }
        }
    },
    candidateFeedback: {
        score: { type: Number, min: 0, max: 10 },
        remarks: { type: String }
    },
    round: { type: String, default: 'Round 2' }
}, { timestamps: true });

module.exports = mongoose.model('Slot', SlotSchema);
