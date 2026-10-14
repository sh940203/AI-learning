const express = require('express');
const router = express.Router();
const UserExamProgress = require('../models/UserExamProgress');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const auth = require('../middleware/authMiddleware');

// ============================================================
// @route   GET /api/analysis/wrong-questions
// @desc    取得學生的錯題列表，支援單卷模式或全局模式
//          ?examId=xxx  → 單卷模式，只看該考卷的錯題
//          (無 examId)  → 全局模式，取得所有已完成考卷的錯題
// @access  Private
// ============================================================
router.get('/wrong-questions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { examId } = req.query;

    // 1. 取得需要分析的進度記錄
    const filter = { userId, status: 'completed' };
    if (examId) filter.examId = examId;
    const progressList = await UserExamProgress.find(filter);

    if (progressList.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. 逐一分析每份進度，找出錯誤的題目
    const wrongQuestions = [];

    for (const progress of progressList) {
      // 載入考卷與題目 (包含正確答案)
      const exam = await Exam.findById(progress.examId).populate('questions');
      if (!exam) continue;

      for (const q of exam.questions) {
        if (!q || !q._id) continue;
        const studentAns = (progress.answers || []).find(
          a => a.questionId === q._id.toString()
        );
        if (!studentAns) continue;

        let isWrong = false;
        let studentSelected = [];
        let correctOptions = [];

        if (q.type === 'single' || q.type === 'tf') {
          const correctOption = q.options.find(o => o.isCorrect);
          const studentChoice = studentAns.selectedOptions?.[0];
          correctOptions = correctOption ? [correctOption.id] : [];
          studentSelected = studentChoice ? [studentChoice] : [];
          isWrong = !correctOption || studentChoice !== correctOption.id;
        } else if (q.type === 'multiple') {
          correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id).sort();
          studentSelected = (studentAns.selectedOptions || []).slice().sort();
          isWrong = JSON.stringify(correctOptions) !== JSON.stringify(studentSelected);
        } else if (q.type === 'fill') {
          const correctOption = q.options?.find(o => o.isCorrect);
          const correctText = correctOption?.text || q.explanation || '';
          const studentText = studentAns.answerText?.trim() || '';
          isWrong = !correctText || studentText.toLowerCase() !== correctText.toLowerCase();
          correctOptions = [correctText];
          studentSelected = [studentText];
        }

        if (isWrong && q.type !== 'short' && q.type !== 'group') {
          wrongQuestions.push({
            questionId: q._id,
            examId: exam._id,
            examTitle: exam.title,
            examYear: exam.examYear,
            subject: q.subject || exam.subject || '',
            html: q.html,
            options: q.options,
            explanation: q.explanation || '',
            tags: q.tags || [],
            category: q.category || '',
            difficulty: q.difficulty || 3,
            studentSelected,
            correctOptions,
            score: q.score || 2
          });
        }
      }
    }

    res.status(200).json({ success: true, data: wrongQuestions });
  } catch (error) {
    console.error('取得錯題列表失敗:', error);
    res.status(500).json({ success: false, message: '取得錯題列表失敗', error: error.message });
  }
});

// ============================================================
// @route   GET /api/analysis/mastery
// @desc    取得觀念掌握度統計
//          ?examId=xxx       → 單卷模式 (只統計該考卷)
//          ?subject=數學甲   → 全局模式，以科目過濾
//          (無任何 query)    → 全局所有科目的分組統計
// @access  Private
// ============================================================
router.get('/mastery', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { examId, subject } = req.query;

    // 1. 取得已完成的進度
    const filter = { userId, status: 'completed' };
    if (examId) filter.examId = examId;
    const progressList = await UserExamProgress.find(filter);

    if (progressList.length === 0) {
      return res.status(200).json({ success: true, data: { byCategory: [], subjects: [] } });
    }

    // 2. 聚合計算各 category 的正確率
    const categoryStats = {}; // { categoryName: { correct: n, total: n, subject: '...' } }
    const subjectSet = new Set();

    for (const progress of progressList) {
      const exam = await Exam.findById(progress.examId).populate('questions');
      if (!exam) continue;

      for (const q of exam.questions) {
        if (!q || !q._id) continue;
        // 科目過濾 (全局模式下支援)
        const qSubject = q.subject || exam.subject || '未分類';
        if (subject && qSubject !== subject) continue;
        subjectSet.add(qSubject);

        const catKey = q.category || '未分類觀念';
        if (!categoryStats[catKey]) {
          categoryStats[catKey] = { correct: 0, total: 0, subject: qSubject };
        }

        const studentAns = (progress.answers || []).find(
          a => a.questionId === q._id.toString()
        );
        if (!studentAns) continue;

        categoryStats[catKey].total += 1;

        let isCorrect = false;
        if (q.type === 'single' || q.type === 'tf') {
          const correctOption = q.options.find(o => o.isCorrect);
          isCorrect = correctOption && studentAns.selectedOptions?.[0] === correctOption.id;
        } else if (q.type === 'multiple') {
          const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id).sort();
          const studentIds = (studentAns.selectedOptions || []).slice().sort();
          isCorrect = JSON.stringify(correctIds) === JSON.stringify(studentIds);
        }

        if (isCorrect) categoryStats[catKey].correct += 1;
      }
    }

    // 3. 轉換為陣列格式，計算掌握率百分比
    const byCategory = Object.entries(categoryStats).map(([name, stats]) => ({
      name,
      subject: stats.subject,
      correct: stats.correct,
      total: stats.total,
      masteryRate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    })).sort((a, b) => a.masteryRate - b.masteryRate); // 由低到高排序，突顯弱點

    res.status(200).json({
      success: true,
      data: {
        byCategory,
        subjects: Array.from(subjectSet)
      }
    });
  } catch (error) {
    console.error('取得掌握度統計失敗:', error);
    res.status(500).json({ success: false, message: '取得掌握度統計失敗', error: error.message });
  }
});

// ============================================================
// AI 解析 JSON 容錯解析
// Gemini 偶爾回傳被截斷或含未轉義字元的 JSON，直接 JSON.parse 會拋出
// 「Unterminated string in JSON」。此處依序嘗試：完整解析 → 逐欄 regex 抽取 → 預設文案補齊。
// ============================================================
const AI_EXPLAIN_FIELDS = ['misconception', 'blindspot', 'suggestion', 'hint'];

const buildFallbackExplain = (correctOptions) => ({
  misconception: '混淆了相關概念的適用範圍與邊界條件',
  blindspot: '忽略了題目中的關鍵限制詞或情境前提',
  suggestion: '建議重新整理相關觀念的脈絡與適用情況',
  hint: `正確答案為「${(correctOptions || []).join('、')}」，關鍵在於仔細閱讀題目中的限定詞。`
});

const unescapeJsonString = (str) => str
  .replace(/\\n/g, '\n')
  .replace(/\\t/g, ' ')
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, '\\')
  .trim();

const parseAIExplainJson = (rawText, correctOptions) => {
  const fallback = buildFallbackExplain(correctOptions);
  let text = String(rawText || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed = null;

  // 1. 截取第一個 { 到最後一個 } 後嘗試標準解析
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch { /* 交給下一層 regex 抽取 */ }
  }

  // 2. 逐欄抽取 (容許結尾引號未閉合的截斷字串)
  if (!parsed || typeof parsed !== 'object') {
    parsed = {};
    for (const field of AI_EXPLAIN_FIELDS) {
      const match = text.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)("|$)`));
      if (match && match[1]) parsed[field] = unescapeJsonString(match[1]);
    }
  }

  // 3. 缺漏或非字串欄位以預設文案補齊，確保前端四欄皆可渲染
  const result = {};
  for (const field of AI_EXPLAIN_FIELDS) {
    const value = parsed[field];
    result[field] = (typeof value === 'string' && value.trim()) ? value.trim() : fallback[field];
  }
  return result;
};

// ============================================================
// @route   POST /api/analysis/ai-explain
// @desc    召喚 AI 針對指定錯題，產生個人化的「謬誤/盲點/建議」三維度解析
// @access  Private
// ============================================================
router.post('/ai-explain', auth, async (req, res) => {
  try {
    const { questionId, studentSelected, correctOptions, questionHtml } = req.body;

    if (!questionId) {
      return res.status(400).json({ success: false, message: '請提供 questionId' });
    }

    // 從資料庫取得題目完整資訊
    const q = await Question.findById(questionId);

    // 組裝給 AI 的提示詞 (Prompt)
    const prompt = `你是一位頂尖的學測/統測輔導老師，請對以下這道學生答錯的選擇題進行精準的錯誤分析。

【題目內容】
${(questionHtml || q?.html || '').replace(/<[^>]+>/g, '')}

【學生選擇的答案】
${(studentSelected || []).join('、')}

【正確答案】
${(correctOptions || []).join('、')}

【題目詳解 (若有)】
${q?.explanation || '無'}

請嚴格按照以下 JSON 格式回傳分析結果（不要加任何額外文字或 markdown code block 標記）：
{
  "misconception": "學生最可能犯的關鍵謬誤（15-30字）",
  "blindspot": "學生忽略的核心觀念盲點（15-30字）",
  "suggestion": "具體的建議強化方向（15-30字）",
  "hint": "一句點到為止的精華提示（20-40字）"
}`;

    // 嘗試呼叫 Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      // 若無 API Key，回傳高質感的預設 Mock 分析
      return res.status(200).json({ success: true, data: buildFallbackExplain(correctOptions) });
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const rawText = response.text() || '{}';

    // 容錯解析 JSON (處理 ```json 包裝、截斷字串與未轉義字元)
    const analysisResult = parseAIExplainJson(rawText, req.body.correctOptions);

    res.status(200).json({ success: true, data: analysisResult });
  } catch (error) {
    console.error('AI 解析失敗:', error);
    // 失敗時回傳友善的預設訊息
    res.status(200).json({
      success: true,
      data: {
        misconception: '系統分析時發生意外錯誤',
        blindspot: '可能原因：API Key無效、額度不足、或題目含有敏感字眼',
        suggestion: '請稍後再試一次，或聯絡開發人員',
        hint: 'AI 服務暫時無法回應，可先參考上方題目詳解。'
      }
    });
  }
});

module.exports = router;
