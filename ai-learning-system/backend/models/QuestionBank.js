const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
