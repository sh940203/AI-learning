const mongoose = require('mongoose');

const userExamProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progressRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  answers: {
    type: Array,
    default: []
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

// Ensure unique combination of userId and examId
userExamProgressSchema.index({ userId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('UserExamProgress', userExamProgressSchema);
