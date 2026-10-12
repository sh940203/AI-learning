const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const QuestionBank = require('../models/QuestionBank');
const QuestionItem = require('../models/QuestionItem');

const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/questionBanks
// @desc    建立新題庫
router.post('/', async (req, res) => {
  try {
    const { name, description, tags, isPublic } = req.body;
    const newBank = new QuestionBank({ name, description, tags, isPublic });
    const savedBank = await newBank.save();
    res.status(201).json({ success: true, data: savedBank });
  } catch (error) {
    res.status(500).json({ success: false, message: '題庫建立失敗', error: error.message });
  }
});

// @route   GET /api/questionBanks
// @desc    獲取所有題庫
router.get('/', async (req, res) => {
  try {
    const banks = await QuestionBank.find().sort({ createdAt: -1 });
    res.json({ success: true, data: banks });
  } catch (error) {
    res.status(500).json({ success: false, message: '讀取題庫失敗', error: error.message });
  }
});

// @route   POST /api/questionBanks/:bankId/import
// @desc    匯入題庫 (支援 JSON, Excel, CSV)
router.post('/:bankId/import', upload.single('file'), async (req, res) => {
  try {
    const { bankId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: '請上傳檔案' });

    let itemsToInsert = [];

    if (file.mimetype === 'application/json') {
      const jsonData = JSON.parse(file.buffer.toString());
      itemsToInsert = jsonData.map(item => ({ ...item, bankId }));
    } else {
      // 解析 Excel 或 CSV
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      itemsToInsert = data.map(row => {
        const options = [
          { id: 'A', text: row.OptionA || '', isCorrect: row.Answer === 'A' },
          { id: 'B', text: row.OptionB || '', isCorrect: row.Answer === 'B' },
          { id: 'C', text: row.OptionC || '', isCorrect: row.Answer === 'C' },
          { id: 'D', text: row.OptionD || '', isCorrect: row.Answer === 'D' },
        ].filter(opt => opt.text !== '');

        return {
          bankId,
          topic: row.Topic || '',
          options,
          explanation: row.Explanation || '',
          difficulty: parseInt(row.Difficulty) || 3,
          tags: row.Tags ? String(row.Tags).split(',').map(t => t.trim()) : []
        };
      });
    }

    const inserted = await QuestionItem.insertMany(itemsToInsert);
    res.json({ success: true, message: `匯入成功，共 ${inserted.length} 題`, data: inserted });
  } catch (error) {
    console.error("Import Error:", error);
    res.status(500).json({ success: false, message: '匯入失敗', error: error.message });
  }
});

// @route   GET /api/questionBanks/:bankId/items
// @desc    獲取題庫下所有題目
router.get('/:bankId/items', async (req, res) => {
  try {
    const items = await QuestionItem.find({ bankId: req.params.bankId }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: '讀取題目失敗', error: error.message });
  }
});

module.exports = router;
