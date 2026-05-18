const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');

// @route   POST /api/exams
// @desc    建立新的測驗題庫檔案 (初期空白)
router.post('/', async (req, res) => {
  try {
    const { folderId, title } = req.body;
    const newExam = new Exam({
      title: title || '未命名題庫',
      folderId: folderId || null,
      status: 'draft'
    });
    
    const savedExam = await newExam.save();
    res.status(201).json({ success: true, data: { ...savedExam.toObject(), type: 'exam' } });
  } catch (error) {
    res.status(500).json({ success: false, message: '建立測驗題庫失敗', error: error.message });
  }
});

// @route   PUT /api/exams/:id
// @desc    更新測驗題庫設定 (ExamSetup / 重新命名 / 題目重新排序)
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    // 移除 `delete updateData.questions;` 讓前端可以傳送重排後的 questions 陣列來更新順序
    
    const exam = await Exam.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!exam) return res.status(404).json({ success: false, message: '找不到考卷' });
    
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新考卷設定失敗', error: error.message });
  }
});

// @route   DELETE /api/exams/:id
// @desc    刪除測驗題庫 (軟刪除)
router.delete('/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!exam) return res.status(404).json({ success: false, message: '找不到考卷' });
    res.status(200).json({ success: true, message: '考卷已刪除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '刪除失敗', error: error.message });
  }
});

// @route   GET /api/exams/:id
// @desc    取得單一考卷設定與所有題目 (進入 Setup 編輯用)
router.get('/:id', async (req, res) => {
  try {
    // 自動展開題目資料，方便前端一次性獲取完整資訊
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam || !exam.isActive) return res.status(404).json({ success: false, message: '找不到考卷' });
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: '讀取考卷失敗', error: error.message });
  }
});

module.exports = router;
