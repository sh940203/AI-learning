const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const KnowledgeBase = require('../models/KnowledgeBase');
const auth = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
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
// @desc    Admin uploads a textbook PDF, parse it and save to DB
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '需要管理員權限' });
    }

    const { subject, chapter, title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: '請提供 PDF 檔案' });
    }

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const newKb = new KnowledgeBase({
      title: title || req.file.originalname,
      subject: subject || '未分類',
      chapter: chapter || '未分類',
      content: data.text,
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id
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

module.exports = router;
