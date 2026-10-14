const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const auth = require('../middleware/authMiddleware');
const { logApiUsage } = require('../services/metricService');

// Optional auth middleware — 不拒絕未登入，只是 req.user 為 null
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded.user;
  } catch {
    req.user = null;
  }
  next();
};

// ============================================================
// @route   POST /api/quiz/generate
// @desc    依知識點標籤，從題庫中隨機撈取既有題目，組裝強化微測驗
// @body    { tags: string[], count: number, examId?: string (排除指定試卷) }
// @access  Public (optional auth — 登入後額外儲存考卷至帳號)
// ============================================================
router.post('/generate', optionalAuth, async (req, res) => {

  try {
    const { tags = [], excludeExamId } = req.body;
    const count = parseInt(req.body.count, 10) || 10;

    // 1. 優先使用「題庫資料庫」進行精準分類取樣 (若是錯 A 類型的題，就精準從題庫資料庫抓 A 類型的題)
    const qbFileService = require('../services/qbFileService');
    const matchedFromExamDb = qbFileService.getQuestionsByTagsOrConcept(tags, count);

    let questions = [];

    if (matchedFromExamDb && matchedFromExamDb.length > 0) {
      // 將「題庫資料庫」取樣題目快速同步至 MongoDB Question 集合，確保具備 _id 可供考卷關聯
      const questionDocs = await Promise.all(matchedFromExamDb.map(async (q) => {
        let existing = await Question.findOne({ originalQbId: q.id });
        if (!existing) {
          existing = new Question({
            originalQbId: q.id,
            // 題庫題型代碼：1 是非 / 2 單選 / 3 多選
            type: q.type === 1 ? 'tf' : q.type === 3 ? 'multiple' : 'single',
            html: q.questionHtml || q.questionText || '(無題目內容)',
            // 選項 text 為必填：純圖選項保留 html，完全空白的選項 (如是非題 C/D) 直接濾除
            options: q.options
              .filter(o => (o.text && o.text.trim()) || (o.html && o.html.trim()))
              .map(o => ({ id: o.id, text: (o.text && o.text.trim()) ? o.text : o.html, isCorrect: o.isCorrect })),
            explanation: q.explanationText || '', // 只存純文字詳解，避免 Word HTML 標籤原樣顯示
            tags: [q.chapterName, q.sectionName, q.textbook].filter(Boolean),
            category: q.chapterName,
            subject: q.textbook,
            // 題庫難度 1/2/3 對應 Question schema 的 1-5 數值尺度
            difficulty: q.difficulty === 1 ? 2 : q.difficulty === 3 ? 4 : 3,
            status: 'saved',
            isActive: true
          });
          await existing.save();
        }
        return existing;
      }));

      questions = questionDocs.map(q => ({
        _id: q._id,
        type: q.type,
        html: q.html,
        options: q.options,
        explanation: q.explanation,
        tags: q.tags,
        category: q.category,
        subject: q.subject,
        difficulty: q.difficulty
      }));
    }

    // 2. Fallback: 若「題庫資料庫」尚未載入或無題目，使用原本 Question aggregate
    if (questions.length === 0) {
      const filter = { status: 'saved', isActive: true };
      if (tags.length > 0) {
        filter.$or = [
          { tags: { $in: tags } },
          { category: { $in: tags } }
        ];
      }
      if (excludeExamId) {
        filter.examId = { $ne: excludeExamId };
      }

      questions = await Question.aggregate([
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
    }

    // 3. Fallback: 如果依據標籤仍找不到題目，改為隨機抽取不限標籤的題目
    if (questions.length === 0) {
      const fallbackFilter = { status: 'saved', isActive: true };
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
        data: { questions: [], message: '目前題庫中尚無符合此知識點的題目，請先在後台新增或同步題庫！' }
      });
    }

    const Exam = require('../models/Exam');
    
    // 建立新考卷 (設定為個人生成的微測驗)
    const newExam = new Exam({
      title: `專屬強化微測驗 - ${new Date().toLocaleDateString('zh-TW')} (題庫資料庫精準匹配)`,
      status: 'published',
      isActive: true,
      isGenerated: true,
      userId: req.user?.id || null,
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
        source: '題庫資料庫 (精準分類取樣)',
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
// @desc    透過「題庫資料庫」母題種子結合 Gemini 動態生成使用者的弱點觀念測驗
// @body    { intensity: 'quick' | 'standard' | 'high', tags?: string[] }
// @access  Private
// ============================================================
router.post('/generate-dynamic', auth, async (req, res) => {
  try {
    const { intensity = 'quick', tags = [] } = req.body;
    let count = 10;
    if (intensity === 'standard') count = 30;
    if (intensity === 'high') count = 50;
    
    // 1. 決定薄弱觀念標籤
    let conceptTags = [...tags];
    if (conceptTags.length === 0) {
      const weakConcepts = await MistakeRecord.find({ userId: req.user.id })
        .sort({ wrongCount: -1 })
        .limit(3);
      conceptTags = weakConcepts.map(c => c.conceptTag);
    }
    if (conceptTags.length === 0) {
      conceptTags = ['商業文書應用', '數位科技概念']; // fallback
    }
    
    // 2. 從「題庫資料庫」中抓取同類型的母題種子
    const qbFileService = require('../services/qbFileService');
    const seedQuestions = qbFileService.getQuestionsByTagsOrConcept(conceptTags, 4);

    let seedContextText = '';
    if (seedQuestions && seedQuestions.length > 0) {
      seedContextText = seedQuestions.map((s, idx) => `
[母題範例 ${idx + 1}]
出處：《${s.textbook}》第${s.chapter}章 ${s.chapterName} - ${s.sectionName}
題目：${s.questionText}
選項：${s.options.map(o => `${o.id}. ${o.text}`).join('  ')}
正確答案：${s.answer}
解析：${s.explanationText || '無'}
`).join('\n');
    }

    if (!genAI) {
      return res.status(500).json({ success: false, message: 'Server missing GEMINI_API_KEY' });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
你是一位專業的高職商科考題專家。
學生近期在以下弱點觀念出現錯誤：${conceptTags.join(', ')}。
為了確保學生正確理解概念，我們從官方《題庫資料庫》精選了同類型的母題範例如下：
${seedContextText}

請嚴格根據以上母題的知識深度、題目風格與核心觀念，生成 ${count} 題「確保觀念強化單選題」：
【重要生成規定】：
1. 嚴格依照學生錯誤的觀念類型出題，絕不可錯 A 觀念卻生成 B 觀念題目！
2. 題目品質必須貼近官方教材規範，選項具備合理干擾項。
3. 詳解必須清楚說明解題概念與正誤原因。
4. 請嚴格回傳一個 JSON 陣列，不要包含 markdown 標籤（如 \`\`\`json）：

[
  {
    "type": "single",
    "html": "<p>題目文字...</p>",
    "options": [
      { "id": "A", "text": "選項 A 文字", "isCorrect": true },
      { "id": "B", "text": "選項 B 文字", "isCorrect": false },
      { "id": "C", "text": "選項 C 文字", "isCorrect": false },
      { "id": "D", "text": "選項 D 文字", "isCorrect": false }
    ],
    "explanation": "詳解分析...",
    "category": "${conceptTags[0] || '專業觀念'}"
  }
]
`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```json')) text = text.replace(/```json|```/g, '').trim();
    if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
    
    const questions = JSON.parse(text);

    // 同步建立考卷記錄
    const questionDocs = await Promise.all(questions.map(async (q) => {
      const doc = new Question({
        type: 'single',
        html: q.html,
        options: q.options,
        explanation: q.explanation,
        tags: conceptTags,
        category: q.category || conceptTags[0],
        status: 'saved',
        isActive: true
      });
      return await doc.save();
    }));

    const Exam = require('../models/Exam');
    const newExam = new Exam({
      title: `AI 觀念確保強化測驗 - ${new Date().toLocaleDateString('zh-TW')}`,
      status: 'published',
      isActive: true,
      isGenerated: true,
      userId: req.user.id,
      displayMode: 'all',
      timeLimit: count === 10 ? 15 : count === 30 ? 45 : 90,
      questions: questionDocs.map(q => q._id)
    });
    const savedExam = await newExam.save();

    const tokens = result.response.usageMetadata?.totalTokenCount || (prompt.length + text.length) * 1.5;
    logApiUsage(tokens, false);

    res.status(200).json({
      success: true,
      data: {
        examId: savedExam._id,
        questions,
        seeds: seedQuestions.map(s => ({
          textbook: s.textbook,
          chapterName: s.chapterName,
          sectionName: s.sectionName,
          questionText: s.questionText
        })),
        totalGenerated: questions.length,
        concepts: conceptTags,
        intensity,
        source: '題庫資料庫 (精準分類 AI 學習衍生)'
      }
    });
    
  } catch (error) {
    console.error('動態生成測驗失敗:', error);
    logApiUsage(0, true);
    res.status(500).json({ success: false, message: '動態生成測驗失敗', error: error.message });
  }
});

module.exports = router;
