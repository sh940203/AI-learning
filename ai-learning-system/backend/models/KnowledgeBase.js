const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  chapter: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Create a text index for basic keyword search
knowledgeBaseSchema.index({ title: 'text', subject: 'text', chapter: 'text', content: 'text' });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
