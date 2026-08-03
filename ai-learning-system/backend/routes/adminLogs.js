const express = require('express');
const router = express.Router();
const UnansweredLog = require('../models/UnansweredLog');

// @route   GET /api/admin/logs/unanswered
// @desc    Get all unanswered questions logs
router.get('/unanswered', async (req, res) => {
  try {
    const logs = await UnansweredLog.find().sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Fetch logs error:", error);
    res.status(500).json({ success: false, message: '獲取紀錄失敗' });
  }
});

// @route   DELETE /api/admin/logs/unanswered/:id
// @desc    Delete a log
router.delete('/unanswered/:id', async (req, res) => {
  try {
    const item = await UnansweredLog.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: '找不到紀錄' });
    res.json({ success: true, message: '已成功刪除' });
  } catch (error) {
    console.error("Delete log error:", error);
    res.status(500).json({ success: false, message: '刪除失敗' });
  }
});

module.exports = router;
