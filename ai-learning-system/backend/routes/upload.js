const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 檔名加上時間戳記避免重複
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('僅允許上傳圖片檔案！'), false);
    }
  }
});

// @route   POST /api/upload/image
// @desc    上傳圖片並回傳 URL
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '請提供圖片檔案' });
    }

    // 未來如果部署到正式環境，這裡可以改為雲端存儲 (S3) 的 URL
    // 目前開發環境先回傳本地路徑
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: fileUrl,
      message: '圖片上傳成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '上傳失敗', error: error.message });
  }
});

module.exports = router;
