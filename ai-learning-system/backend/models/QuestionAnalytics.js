const mongoose = require('mongoose');

const questionAnalyticsSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuestionAnalytics', questionAnalyticsSchema);
