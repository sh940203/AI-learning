const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('僅支援 PDF 格式！'), false);
    }
  }
});

// @route   POST /api/ai/parse-pdf
// @desc    Uploads a PDF and returns extracted text
router.post('/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '請上傳 PDF 檔案' });
    }

    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text;

    res.json({
      success: true,
      text: extractedText
    });
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    res.status(500).json({ success: false, message: '解析 PDF 發生錯誤' });
  }
});

module.exports = router;
