const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 測試 API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running perfectly!' });
});

// 根目錄路由
app.get('/', (req, res) => {
  res.send('Welcome to AI Learning System API Server');
});

// 路由設定
app.use('/api/auth', require('./routes/auth'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin/knowledge', require('./routes/adminKnowledge'));

// 提供靜態檔案存取 (圖片等)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 資料庫連線 (等待您補上 MONGODB_URI)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ 成功連接至 MongoDB Atlas'))
    .catch((err) => console.error('❌ MongoDB 連線失敗:', err));
} else {
  console.log('⚠️ 尚未設定 MONGODB_URI，請在 .env 檔案中補上。');
}

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 伺服器運行於 http://localhost:${PORT}`);
});
