const mongoose = require('mongoose');

const ScreenshotSchema = new mongoose.Schema({
    candidateId: {
        type: String, // Can be ObjectId string or any identifier
        required: true,
        index: true,
    },
    image: {
        type: String, // Base64 encoded image
        required: true,
    },
    type: {
        type: String,
        enum: ['video', 'screen', 'mismatch'],
        default: 'video',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Screenshot', ScreenshotSchema);
