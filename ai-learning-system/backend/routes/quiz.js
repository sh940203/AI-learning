const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const auth = require('../middleware/authMiddleware');

// ============================================================
// @route   POST /api/quiz/generate
// @desc    依知識點標籤，從題庫中隨機撈取既有題目，組裝強化微測驗
// @body    { tags: string[], count: number, examId?: string (排除指定試卷) }
// @access  Private
// ============================================================
router.post('/generate', auth, async (req, res) => {
  try {
    const { tags = [], count = 10, excludeExamId } = req.body;

    // 1. 建立篩選條件
    const filter = { status: 'saved', isActive: true };

    // 若提供 tags，使用 $in 匹配任一標籤
    if (tags.length > 0) {
      filter.$or = [
        { tags: { $in: tags } },
        { category: { $in: tags } }
      ];
    }

    // 排除原始考卷的題目（避免重複練習同一批）
    if (excludeExamId) {
      filter.examId = { $ne: excludeExamId };
    }

    // 2. 從題庫中隨機取樣
    let questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(count) } },
      {
        $project: {
          _id: 1, type: 1, html: 1, options: 1,
          subQuestions: 1, explanation: 1, tags: 1,
          category: 1, subject: 1, score: 1, difficulty: 1
        }
      }
    ]);

    // 3. Fallback: 如果依據標籤找不到題目，改為隨機抽取不限標籤的題目（避免使用者覺得壞掉）
    if (questions.length === 0) {
      const fallbackFilter = { status: 'saved', isActive: true };
      // 移除 excludeExamId，確保如果資料庫只有一張考卷，至少還能撈出裡面的題目
      
      questions = await Question.aggregate([
        { $match: fallbackFilter },
        { $sample: { size: parseInt(count) } },
        {
          $project: {
            _id: 1, type: 1, html: 1, options: 1,
            subQuestions: 1, explanation: 1, tags: 1,
            category: 1, subject: 1, score: 1, difficulty: 1
          }
        }
      ]);
    }

    if (questions.length === 0) {
      return res.status(200).json({
        success: true,
        data: { questions: [], message: '目前題庫中尚無符合此知識點的題目，請先在後台新增更多題目！' }
      });
    }

    const Exam = require('../models/Exam');
    
    // 建立新考卷 (設定為個人生成的微測驗)
    const newExam = new Exam({
      title: `專屬強化微測驗 - ${new Date().toLocaleDateString('zh-TW')}`,
      status: 'published',
      isActive: true,
      isGenerated: true,
      userId: req.user.id,
      displayMode: 'all',
      timeLimit: count === 10 ? 15 : count === 30 ? 45 : 90,
      questions: questions.map(q => q._id)
    });
    const savedExam = await newExam.save();

    res.status(200).json({
      success: true,
      data: {
        questions,
        examId: savedExam._id,
        totalFound: questions.length,
        requestedCount: count,
        tags
      }
    });
  } catch (error) {
    console.error('生成強化微測驗失敗:', error);
    res.status(500).json({ success: false, message: '生成測驗失敗', error: error.message });
  }
});

const { GoogleGenerativeAI } = require('@google/generative-ai');
const MistakeRecord = require('../models/MistakeRecord');

// Setup Gemini API client
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// ============================================================
// @route   POST /api/quiz/generate-dynamic
// @desc    透過 Gemini 動態生成使用者的弱點觀念測驗
// @body    { intensity: 'quick' | 'standard' | 'high' }
// @access  Private
// ============================================================
router.post('/generate-dynamic', auth, async (req, res) => {
  try {
    const { intensity = 'quick' } = req.body;
    let count = 10;
    if (intensity === 'standard') count = 30;
    if (intensity === 'high') count = 50;
    
    // 取出最弱的 3 個觀念
    const weakConcepts = await MistakeRecord.find({ userId: req.user.id })
      .sort({ wrongCount: -1 })
      .limit(3);
      
    let conceptTags = weakConcepts.map(c => c.conceptTag);
    if (conceptTags.length === 0) {
      conceptTags = ['基礎綜合測驗']; // fallback if no mistakes
    }
    
    if (!genAI) {
      return res.status(500).json({ success: false, message: 'Server missing GEMINI_API_KEY' });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
你是一位專業的考題生成專家。請針對以下薄弱觀念生成 ${count} 題單選題：
薄弱觀念: ${conceptTags.join(', ')}

請嚴格回傳一個 JSON 陣列，每個元素代表一題，格式如下，不要包含 markdown 標籤：
[
  {
    "type": "single",
    "html": "題目內容...",
    "options": [
      { "id": "A", "text": "選項 A", "isCorrect": true },
      { "id": "B", "text": "選項 B", "isCorrect": false },
      { "id": "C", "text": "選項 C", "isCorrect": false },
      { "id": "D", "text": "選項 D", "isCorrect": false }
    ],
    "explanation": "詳解..."
  }
]
`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```json')) text = text.replace(/```json|```/g, '').trim();
    if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
    
    const questions = JSON.parse(text);

    res.status(200).json({
      success: true,
      data: {
        questions,
        totalGenerated: questions.length,
        concepts: conceptTags,
        intensity
      }
    });
    
  } catch (error) {
    console.error('動態生成測驗失敗:', error);
    res.status(500).json({ success: false, message: '動態生成測驗失敗', error: error.message });
  }
});

module.exports = router;
