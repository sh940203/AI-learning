const mongoose = require('mongoose');

const mistakeRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  conceptTag: {
    type: String,
    required: true
  },
  wrongCount: {
    type: Number,
    default: 1
  },
  lastErrorDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to quickly find user's mistakes by concept
mistakeRecordSchema.index({ userId: 1, conceptTag: 1 });
mistakeRecordSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('MistakeRecord', mistakeRecordSchema);
