const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Exam = require('../models/Exam');

// @route   GET /api/folders
// @desc    取得特定資料夾內的子資料夾與測驗題庫檔案 (如果 parentId=null，代表根目錄)
router.get('/', async (req, res) => {
  try {
    const parentId = req.query.parentId || null;
    
    // 取得資料夾
    const folders = await Folder.find({ parentId, isActive: true }).sort({ createdAt: -1 });
    
    // 取得考卷檔案
    const exams = await Exam.find({ folderId: parentId, isActive: true }).sort({ createdAt: -1 });
    
    // 將資料夾與檔案合併，統一加上 type 標識
    const resources = [
      ...folders.map(f => ({ ...f.toObject(), type: 'folder' })),
      ...exams.map(e => ({ ...e.toObject(), type: 'exam' }))
    ];
    
    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: '讀取資源失敗', error: error.message });
  }
});

// @route   POST /api/folders
// @desc    新增資料夾
router.post('/', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const newFolder = new Folder({ name, parentId: parentId || null });
    const savedFolder = await newFolder.save();
    res.status(201).json({ success: true, data: { ...savedFolder.toObject(), type: 'folder' } });
  } catch (error) {
    res.status(500).json({ success: false, message: '新增資料夾失敗', error: error.message });
  }
});

// @route   PUT /api/folders/:id
// @desc    更新資料夾名稱
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!folder) return res.status(404).json({ success: false, message: '找不到資料夾' });
    res.status(200).json({ success: true, data: { ...folder.toObject(), type: 'folder' } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失敗', error: error.message });
  }
});

// @route   DELETE /api/folders/:id
// @desc    刪除資料夾 (軟刪除)
router.delete('/:id', async (req, res) => {
  try {
    const folder = await Folder.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!folder) return res.status(404).json({ success: false, message: '找不到資料夾' });
    res.status(200).json({ success: true, message: '資料夾已刪除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '刪除失敗', error: error.message });
  }
});

module.exports = router;
