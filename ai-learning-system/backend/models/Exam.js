const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, default: '未命名題庫' },
  // 基本資訊
  examCategory: {
    type: String,
    enum: ['GSAT', 'TVEJE']
  }, // 學測 (GSAT) 或 統測 (TVEJE)123
  examYear: { type: String },  // 例如："114"
  subject: { type: String }, // 例如："英文考科", "共同科目-國文"

  // 考試規則
  timeLimit: { type: Number, default: 60 }, // 分鐘
  noTimeLimit: { type: Boolean, default: false },
  deadline: { type: Date }, // 截止日期與時間
  displayMode: { type: String, enum: ['all', 'sequential'], default: 'all' },
  showAnswerAfterSubmit: { type: Boolean, default: true },
  showScoreAfterSubmit: { type: Boolean, default: true },
  allowRetake: { type: Boolean, default: false },
  retakeLimit: { type: Number, default: 1 },

  // 計分設定
  defaultScore: { type: Number, default: 2 },
  maxScore: { type: Number },
  noMaxScore: { type: Boolean, default: true },
  scoringMode: { type: String, enum: ['standard', 'penalty', 'weighted'], default: 'standard' },
  penaltyAmount: { type: Number, default: 0.5 },

  // 關聯到這張考卷下的所有題目 (Order matters, 陣列順序即為題號順序)
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],

  // 檔案管理
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },

  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
