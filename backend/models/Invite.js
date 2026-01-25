const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    questionnaireId: { type: mongoose.Schema.Types.ObjectId, ref: 'Questionnaire' }, // Optional, can be dynamic
    round: { type: String, required: true },
    domain: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Used', 'Expired'], default: 'Pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Invite', InviteSchema);
