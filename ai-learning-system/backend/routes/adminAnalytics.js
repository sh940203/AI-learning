const express = require('express');
const router = express.Router();
const QuestionAnalytics = require('../models/QuestionAnalytics');

// @route   GET /api/admin/analytics/tags
// @desc    Get top tags for learning heatmap
router.get('/tags', async (req, res) => {
  try {
    const topTags = await QuestionAnalytics.aggregate([
      {
        $group: {
          _id: "$tag",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: topTags
    });
  } catch (error) {
    console.error("Fetch Analytics Error:", error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

module.exports = router;
