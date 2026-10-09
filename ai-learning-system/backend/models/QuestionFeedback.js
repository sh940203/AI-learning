const mongoose = require('mongoose');

const questionFeedbackSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionItem', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 可選
  type: { type: String, enum: ['error', 'rating', 'suggestion', 'system_error', 'system_suggestion'], required: true }, // 報錯、評分、建議、系統錯誤、系統建議
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  status: { type: String, enum: ['pending', 'resolved', 'ignored'], default: 'pending' } // 後台處理狀態
}, { timestamps: true });

module.exports = mongoose.model('QuestionFeedback', questionFeedbackSchema);
