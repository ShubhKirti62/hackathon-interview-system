const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    domain: { type: String, required: true },
    experienceLevel: {
        type: String,
        enum: ['Fresher/Intern', '1-2 years', '2-4 years', '4-6 years', '6-8 years', '8-10 years', 'All'],
        required: true
    },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    type: { type: String, enum: ['MCQ', 'Descriptive'], default: 'MCQ' },
    options: [{ type: String }], // Array of options for MCQs
    correctAnswers: [{ type: String }], // Array of correct options
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
