const express = require('express');
const router = express.Router();
const QuestionFeedback = require('../models/QuestionFeedback');

// @route   POST /api/feedbacks
// @desc    新增反饋 (學生報錯、評分等)
router.post('/', async (req, res) => {
  try {
    const { questionId, type, content, rating, userId } = req.body;
    const newFeedback = new QuestionFeedback({
      questionId,
      userId,
      type,
      content,
      rating
    });
    
    const savedFeedback = await newFeedback.save();
    res.status(201).json({ success: true, data: savedFeedback, message: '感謝您的反饋！' });
  } catch (error) {
    res.status(500).json({ success: false, message: '提交反饋失敗', error: error.message });
  }
});

// @route   GET /api/feedbacks
// @desc    後台獲取所有反饋
router.get('/', async (req, res) => {
  try {
    const feedbacks = await QuestionFeedback.find()
      .populate('questionId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: '讀取反饋失敗', error: error.message });
  }
});

// @route   PUT /api/feedbacks/:id/status
// @desc    更新反饋處理狀態
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await QuestionFeedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: '找不到該反饋' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: '狀態更新失敗', error: error.message });
  }
});

module.exports = router;
