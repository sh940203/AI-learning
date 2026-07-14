const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  content: {
    type: String,
    required: true
  }
});

const aiChatSessionSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: '新對話'
  },
  imageUrl: {
    type: String
  },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('AIChatSession', aiChatSessionSchema);
