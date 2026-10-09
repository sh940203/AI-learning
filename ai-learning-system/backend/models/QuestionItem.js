const mongoose = require('mongoose');

const questionItemSchema = new mongoose.Schema({
  bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank', required: true },
  topic: { type: String, required: true }, // 題目內容
  options: [{
    id: String, // 'A', 'B', 'C', 'D'
    text: String,
    isCorrect: Boolean
  }],
  explanation: { type: String }, // 解析
  difficulty: { type: Number, min: 1, max: 5, default: 3 }, // 難易度
  tags: [{ type: String }] // 標籤
}, { timestamps: true });

module.exports = mongoose.model('QuestionItem', questionItemSchema);
