const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    round: { type: String, default: '1' },
    domain: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    responses: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        userResponseAudio: { type: String }, // URL/Path to audio
        userResponseText: { type: String }, // Transcribed text
        aiFeedback: { type: String },
        timeTakenSeconds: { type: Number },
        score: { type: Number } // Individual question score if needed
    }],
    feedback: {
        communication: { type: Number, min: 0, max: 10 },
        confidence: { type: Number, min: 0, max: 10 },
        technical: { type: Number, min: 0, max: 10 },
        remarks: { type: String }
    },
    aiOverallSummary: { type: String },
    status: { type: String, enum: ['Scheduled', 'In-Progress', 'Completed'], default: 'Scheduled' },
    currentQuestionIndex: { type: Number, default: 0 },
    remainingTime: { type: Number }, // in seconds
    completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Interview', InterviewSchema);
