const mongoose = require('mongoose');

const QuestionnaireSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    domain: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Questionnaire', QuestionnaireSchema);
