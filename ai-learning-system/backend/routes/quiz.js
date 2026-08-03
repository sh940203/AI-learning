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
    const questions = await Question.aggregate([
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

    if (questions.length === 0) {
      return res.status(200).json({
        success: true,
        data: { questions: [], message: '目前題庫中尚無符合此知識點的題目，請先在後台新增更多題目！' }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        questions,
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

module.exports = router;
