const express = require('express');
const router = express.Router();
const UserExamProgress = require('../models/UserExamProgress');
const Exam = require('../models/Exam');

// @route   GET /api/progress/stats
// @desc    取得目前登入學生的整體統計數據 (完成度、平均分數)
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. 取得所有已發布的考卷數量
    const totalExamsCount = await Exam.countDocuments({ status: 'published', isActive: true });

    // 2. 取得此學生已完成的考卷進度
    const completedProgress = await UserExamProgress.find({ userId, status: 'completed' });
    const completedCount = completedProgress.length;

    // 3. 計算平均分數
    let averageScore = 0;
    if (completedCount > 0) {
      const totalScore = completedProgress.reduce((sum, item) => sum + (item.score || 0), 0);
      averageScore = parseFloat((totalScore / completedCount).toFixed(1));
    }

    // 4. 計算完成進度百分比
    const progressRate = totalExamsCount > 0 ? Math.round((completedCount / totalExamsCount) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        progressRate,
        averageScore,
        completedCount,
        totalExamsCount
      }
    });
  } catch (error) {
    console.error('取得統計數據失敗:', error);
    res.status(500).json({ success: false, message: '讀取統計失敗', error: error.message });
  }
});

// @route   GET /api/progress/exams
// @desc    取得此學生的所有試卷作答進度對照表
// @access  Private
router.get('/exams', async (req, res) => {
  try {
    const userId = req.user.id;
    // 聯集 (populate) 考卷資料取得 title
    const progressList = await UserExamProgress.find({ userId }).populate('examId', 'title');
    
    // 格式化資料，確保 examId 仍然是字串（向下相容前端），但新增 examTitle 欄位
    const formattedList = progressList.map(p => {
      const obj = p.toObject();
      if (obj.examId && typeof obj.examId === 'object') {
        obj.examTitle = obj.examId.title;
        obj.examId = obj.examId._id.toString();
      }
      return obj;
    });

    res.status(200).json({ success: true, data: formattedList });
  } catch (error) {
    res.status(500).json({ success: false, message: '讀取進度對照表失敗', error: error.message });
  }
});

// @route   POST /api/progress/update
// @desc    更新或建立試卷作答進度 (如開始考試、繼續練習、完成考試)
// @access  Private
router.post('/update', async (req, res) => {
  try {
    const userId = req.user.id;
    const { examId, status, progressRate, score, answers } = req.body;

    if (!examId) {
      return res.status(400).json({ success: false, message: '請提供 examId' });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (progressRate !== undefined) updateFields.progressRate = progressRate;
    if (score !== undefined) updateFields.score = score;
    if (answers !== undefined) updateFields.answers = answers;
    
    if (status === 'completed') {
      updateFields.completedAt = new Date();
      
      // 後端自動批改計分
      if (answers && Array.isArray(answers)) {
        try {
          const exam = await Exam.findById(examId).populate('questions');
          if (exam) {
            let computedScore = 0;
            for (const q of exam.questions) {
              const studentAns = answers.find(a => a.questionId === q._id.toString());
              if (!studentAns) continue;

              if (q.type === 'single' || q.type === 'tf') {
                const correctOption = q.options.find(o => o.isCorrect);
                const studentChoice = studentAns.selectedOptions && studentAns.selectedOptions[0];
                if (correctOption && studentChoice === correctOption.id) {
                  computedScore += q.score || exam.defaultScore || 2;
                }
              } else if (q.type === 'multiple') {
                const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.id).sort();
                const studentChoices = (studentAns.selectedOptions || []).slice().sort();
                if (
                  correctOptionIds.length === studentChoices.length &&
                  correctOptionIds.every((val, index) => val === studentChoices[index])
                ) {
                  computedScore += q.score || exam.defaultScore || 2;
                }
              } else if (q.type === 'group') {
                if (q.subQuestions && q.subQuestions.length > 0) {
                  for (const subQ of q.subQuestions) {
                    const subAns = (studentAns.subQuestionAnswers || []).find(sa => sa.subQuestionId === subQ._id.toString());
                    if (!subAns) continue;

                    if (subQ.type === 'single' || subQ.type === 'tf') {
                      const correctOption = subQ.options.find(o => o.isCorrect);
                      const studentChoice = subAns.selectedOptions && subAns.selectedOptions[0];
                      if (correctOption && studentChoice === correctOption.id) {
                        computedScore += 2; // 每子題 2 分
                      }
                    } else if (subQ.type === 'multiple') {
                      const correctOptionIds = subQ.options.filter(o => o.isCorrect).map(o => o.id).sort();
                      const studentChoices = (subAns.selectedOptions || []).slice().sort();
                      if (
                        correctOptionIds.length === studentChoices.length &&
                        correctOptionIds.every((val, index) => val === studentChoices[index])
                      ) {
                        computedScore += 2;
                      }
                    }
                  }
                }
              } else if (q.type === 'fill') {
                const correctOption = q.options && q.options.find(o => o.isCorrect);
                const correctText = correctOption ? correctOption.text : (q.explanation || '');
                const studentText = studentAns.answerText || (studentAns.selectedOptions && studentAns.selectedOptions[0]);
                if (correctText && studentText && studentText.trim().toLowerCase() === correctText.trim().toLowerCase()) {
                  computedScore += q.score || exam.defaultScore || 2;
                }
              }
            }
            updateFields.score = computedScore;
          }
        } catch (err) {
          console.error('自動批改失敗:', err);
        }
      }
    }

    const progress = await UserExamProgress.findOneAndUpdate(
      { userId, examId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: progress, message: '進度更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新進度失敗', error: error.message });
  }
});

// @route   POST /api/progress/seed
// @desc    測試用：自動為學生產生模擬作答進度數據 (便於前端直接顯示 已完成/進行中 等效果)
// @access  Private
router.post('/seed', async (req, res) => {
  try {
    const userId = req.user.id;

    // 取得目前所有已發布考卷
    const exams = await Exam.find({ status: 'published', isActive: true });
    
    if (exams.length === 0) {
      return res.status(400).json({ success: false, message: '資料庫中目前沒有已發布的考卷，請先去後台發布考卷！' });
    }

    // 清除該使用者的現有進度
    await UserExamProgress.deleteMany({ userId });

    const seedData = [];

    // 為前幾張考卷產生一些進度
    if (exams[0]) {
      seedData.push({
        userId,
        examId: exams[0]._id,
        status: 'completed',
        progressRate: 100,
        score: 92,
        completedAt: new Date()
      });
    }
    if (exams[1]) {
      seedData.push({
        userId,
        examId: exams[1]._id,
        status: 'completed',
        progressRate: 100,
        score: 88,
        completedAt: new Date()
      });
    }
    if (exams[2]) {
      seedData.push({
        userId,
        examId: exams[2]._id,
        status: 'in_progress',
        progressRate: 45,
        score: 0
      });
    }

    const savedProgress = await UserExamProgress.insertMany(seedData);
    res.status(200).json({ success: true, data: savedProgress, message: '已成功產生測試進度數據！' });
  } catch (error) {
    res.status(500).json({ success: false, message: '產生測試數據失敗', error: error.message });
  }
});

module.exports = router;
