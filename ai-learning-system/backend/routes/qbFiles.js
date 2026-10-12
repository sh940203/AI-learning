const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const qbFileService = require('../services/qbFileService');

// 定位「題庫資料庫」資料夾
const QB_DIR = qbFileService.getQbDir();

// @route   GET /api/qb-files/summary
// @desc    取得題庫資料庫檔案整體摘要與統計數據
router.get('/summary', (req, res) => {
  try {
    const summary = qbFileService.getSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('取得題庫摘要失敗:', error);
    res.status(500).json({ success: false, message: '取得題庫摘要失敗', error: error.message });
  }
});

// @route   GET /api/qb-files/hierarchy
// @desc    取得教材、章節、小節階層架構與題目數量
router.get('/hierarchy', (req, res) => {
  try {
    const { textbook } = req.query;
    const hierarchy = qbFileService.getHierarchy(textbook);
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    console.error('取得階層失敗:', error);
    res.status(500).json({ success: false, message: '取得階層失敗', error: error.message });
  }
});

// @route   GET /api/qb-files/questions
// @desc    檢索與分頁瀏覽題庫題目
router.get('/questions', (req, res) => {
  try {
    const {
      textbook,
      chapter,
      section,
      difficulty,
      type,
      hasImage,
      keyword,
      page = 1,
      limit = 20
    } = req.query;

    const result = qbFileService.searchQuestions({
      textbook,
      chapter,
      section,
      difficulty,
      type,
      hasImage,
      keyword,
      page,
      limit
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('搜尋題目失敗:', error);
    res.status(500).json({ success: false, message: '搜尋題目失敗', error: error.message });
  }
});

// @route   GET /api/qb-files/questions/:id
// @desc    取得單一題目的完整詳情與附圖資訊
router.get('/questions/:id', (req, res) => {
  try {
    const question = qbFileService.getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: '找不到此題目' });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    console.error('取得題目失敗:', error);
    res.status(500).json({ success: false, message: '取得題目失敗', error: error.message });
  }
});

// @route   POST /api/qb-files/sync
// @desc    強制重新掃描「題庫資料庫」資料夾與 MDB 檔案
router.post('/sync', async (req, res) => {
  try {
    await qbFileService.init();
    res.json({
      success: true,
      message: '題庫資料庫已成功重新同步掃描！',
      data: qbFileService.getSummary()
    });
  } catch (error) {
    console.error('同步題庫失敗:', error);
    res.status(500).json({ success: false, message: '同步題庫失敗', error: error.message });
  }
});

// @route   POST /api/qb-files/test-match
// @desc    測試錯題觀念或提問在題庫資料庫中的匹配取樣 (供管理者測試 AI 出題種子)
router.post('/test-match', (req, res) => {
  try {
    const { tags = [], query = '', count = 5 } = req.body;
    
    let matched = [];
    if (query) {
      matched = qbFileService.getQuestionsForAIContext(query, parseInt(count, 10) || 5);
    } else {
      matched = qbFileService.getQuestionsByTagsOrConcept(tags, parseInt(count, 10) || 5);
    }

    res.json({
      success: true,
      data: {
        totalFound: matched.length,
        tags,
        query,
        matchedQuestions: matched
      }
    });
  } catch (error) {
    console.error('測試匹配失敗:', error);
    res.status(500).json({ success: false, message: '測試匹配失敗', error: error.message });
  }
});

// @route   GET /api/qb-files/media/:textbook/*filePath
// @desc    靜態串流教材 data 資料夾內的圖片與附件
router.get('/media/:textbook/*filePath', (req, res) => {
  try {
    const textbook = decodeURIComponent(req.params.textbook);
    const relParts = Array.isArray(req.params.filePath) ? req.params.filePath : [req.params.filePath || ''];
    const fullFilePath = path.join(QB_DIR, textbook, ...relParts);

    // 安全性防範：確認路徑未跳出 QB_DIR
    const resolvedPath = path.resolve(fullFilePath);
    if (!resolvedPath.startsWith(path.resolve(QB_DIR))) {
      return res.status(403).send('Forbidden file path access');
    }

    if (!fs.existsSync(resolvedPath)) {
      // 若請求 .emz 且不存在，嘗試發送同名 .png
      if (resolvedPath.endsWith('.emz') || resolvedPath.endsWith('.wmz')) {
        const altPng = resolvedPath.replace(/\.(?:emz|wmz)$/i, '.png');
        if (fs.existsSync(altPng)) {
          return res.sendFile(altPng);
        }
      }
      return res.status(404).send('File not found');
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.htm': 'text/html; charset=utf-8',
      '.html': 'text/html; charset=utf-8'
    };

    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }

    // 快取 1 天
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(resolvedPath);
  } catch (error) {
    console.error('讀取媒體資源失敗:', error);
    res.status(500).send('Internal media server error');
  }
});

module.exports = router;
