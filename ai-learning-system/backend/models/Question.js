const mongoose = require('mongoose');

// 選項的 Schema
const optionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // 'A', 'B', '1', 等
  text: { type: String, required: true }, // 選項內容 (可能包含 LaTeX)
  isCorrect: { type: Boolean, default: false }
});

// 子題的 Schema (專為題組設計)
const subQuestionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['single', 'multiple', 'tf', 'fill', 'short', 'listening'],
    required: true
  },
  html: { type: String }, // 子題的題目敘述 (包含 LaTeX)
  options: [optionSchema],
  wordLimit: { type: Number, default: 0 },
  explanation: { type: String }, // 標準答案補充 / 題目詳解
});

// 主題目的 Schema
const questionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['single', 'multiple', 'tf', 'fill', 'short', 'group', 'listening'],
    required: true 
  },
  html: { type: String, required: true }, // 題目主幹敘述 / 題組本文 (取代 content)
  options: [optionSchema], // 獨立題型的選項
  wordLimit: { type: Number, default: 0 }, // 獨立題型的字數限制
  subQuestions: [subQuestionSchema], // 題組專用的子題陣列
  explanation: { type: String }, // 標準答案補充 / 題目詳解
  
  // 媒體檔案與其他元資料
  images: [{ type: String }], // 未來上傳的圖片 URL
  audio: { type: String },    // 聽力題的音檔 URL
  
  // 關聯與分類
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, // 綁定到哪張考卷
  score: { type: Number, default: 2 }, // 單題配分
  category: { type: String }, // 題目單元 (例如："第一章")
  difficulty: { type: Number, min: 1, max: 5, default: 3 },
  status: { type: String, enum: ['draft', 'saved'], default: 'draft' }, // 草稿或已儲存
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
