const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Exam = require('../models/Exam');

// @route   POST /api/questions
// @desc    建立新題目
// @access  Public (未來可加上 token 驗證)
router.post('/', async (req, res) => {
  console.log('收到新增題目請求:', req.body);
  try {
    const {
      type,
      html,
      options,
      explanation,
      score,
      category,
      difficulty,
      status,
      examId
    } = req.body;

    const newQuestion = new Question({
      type,
      html,
      options,
      explanation,
      score,
      category,
      difficulty,
      status,
      examId
    });

    const savedQuestion = await newQuestion.save();

    // 如果有提供 examId，同步更新 Exam 的 questions 陣列
    if (examId) {
      await Exam.findByIdAndUpdate(examId, {
        $push: { questions: savedQuestion._id }
      });
    }

    res.status(201).json({ success: true, data: savedQuestion, message: '題目已成功儲存至題庫' });
  } catch (error) {
    console.error('新增題目錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
});

// @route   GET /api/questions
// @desc    取得所有題目
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { examId } = req.query;
    if (examId) {
      // 1. 若指定考卷，透過 Exam populate 來保證回傳順序與陣列儲存順序 100% 一致 (解決題號錯亂問題)
      const exam = await Exam.findById(examId).populate('questions');
      if (!exam) return res.status(404).json({ success: false, message: '找不到考卷' });
      
      // 過濾掉可能已被刪除但仍殘留在陣列中的 null (孤兒數據防呆)
      const validQuestions = exam.questions.filter(q => q !== null);
      return res.status(200).json({ success: true, data: validQuestions });
    }
    
    // 2. 未指定考卷，單純抓取所有題目 (預設依建立時間)
    const questions = await Question.find({}).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error('讀取題目錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
});

// @route   PUT /api/questions/:id
// @desc    更新題目內容
router.put('/:id', async (req, res) => {
  try {
    const oldQuestion = await Question.findById(req.params.id);
    if (!oldQuestion) return res.status(404).json({ success: false, message: '找不到該題目' });

    const newExamId = req.body.examId;
    
    // 如果 examId 有變更，需要進行雙向同步 (解決題目轉移考卷的孤兒問題)
    if (newExamId && oldQuestion.examId && newExamId !== oldQuestion.examId.toString()) {
      // 從舊的考卷中移除
      await Exam.findByIdAndUpdate(oldQuestion.examId, {
        $pull: { questions: oldQuestion._id }
      });
      // 加入新的考卷
      await Exam.findByIdAndUpdate(newExamId, {
        $push: { questions: oldQuestion._id }
      });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedQuestion, message: '題目已成功更新' });
  } catch (error) {
    console.error('更新題目錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
});

// @route   DELETE /api/questions/:id
// @desc    刪除題目
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: '找不到該題目' });
    
    // 同步移除 Exam 中的引用
    if (question.examId) {
      await Exam.findByIdAndUpdate(question.examId, {
        $pull: { questions: question._id }
      });
    }
    
    res.status(200).json({ success: true, message: '題目已刪除' });
  } catch (error) {
    console.error('刪除題目錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
});

module.exports = router;
