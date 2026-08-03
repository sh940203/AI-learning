const mongoose = require('mongoose');

const unansweredLogSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  resolved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('UnansweredLog', unansweredLogSchema);
