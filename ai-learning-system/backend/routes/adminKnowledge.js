const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const KnowledgeBase = require('../models/KnowledgeBase');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('僅支援 PDF 格式的講義！'), false);
    }
  }
});

// @route   POST /api/admin/knowledge/upload
// @desc    Uploads a textbook PDF, parse it and save to DB (discarding the file)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { subject, chapter, title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: '請提供 PDF 檔案' });
    }

    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);

    const newKb = new KnowledgeBase({
      title: title || req.file.originalname,
      subject: subject || '未分類',
      chapter: chapter || '未分類',
      content: data.text
    });

    await newKb.save();

    res.status(200).json({
      success: true,
      message: '知識庫建立成功',
      data: newKb
    });
  } catch (error) {
    console.error("❌ Knowledge Base Upload Error:", error);
    res.status(500).json({ success: false, message: '知識庫建立失敗', error: error.message });
  }
});

// @route   GET /api/admin/knowledge
// @desc    Get all knowledge base items
router.get('/', async (req, res) => {
  try {
    const items = await KnowledgeBase.find().sort({ createdAt: -1 }).select('-content');
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: '獲取知識庫失敗' });
  }
});

// @route   PUT /api/admin/knowledge/:id
// @desc    Edit knowledge base item metadata
router.put('/:id', async (req, res) => {
  try {
    const { title, subject, chapter } = req.body;
    const updated = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { title, subject, chapter },
      { new: true }
    ).select('-content');
    
    if (!updated) return res.status(404).json({ success: false, message: '找不到檔案' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失敗' });
  }
});

// @route   DELETE /api/admin/knowledge/:id
// @desc    Delete a knowledge base item
router.delete('/:id', async (req, res) => {
  try {
    const item = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: '找不到檔案' });
    
    res.json({ success: true, message: '已成功刪除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '刪除失敗' });
  }
});

module.exports = router;
