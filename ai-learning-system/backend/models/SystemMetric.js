const mongoose = require('mongoose');

const systemMetricSchema = new mongoose.Schema({
  date: {
    type: String, // e.g. YYYY-MM-DD
    required: true,
    unique: true
  },
  apiCalls: {
    type: Number,
    default: 0
  },
  estimatedTokens: {
    type: Number,
    default: 0
  },
  errors: {
    type: Number,
    default: 0
  },
  hourlyApiCalls: {
    type: [Number], // array of 24 integers representing each hour
    default: Array(24).fill(0)
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemMetric', systemMetricSchema);
