const express = require('express');
const router = express.Router();
const KnowledgeBase = require('../models/KnowledgeBase');

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
