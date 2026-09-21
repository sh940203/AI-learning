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
const SystemMetric = require('../models/SystemMetric');

// @route   GET /api/admin/analytics/performance
// @desc    Get system performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { date, timeframe = 'hour' } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    let chartData = [];
    let tokenUsage = 0;
    let apiCalls = 0;
    
    if (timeframe === 'hour') {
      let metric = await SystemMetric.findOne({ date: targetDate });
      if (!metric) {
        chartData = Array(24).fill(0);
      } else {
        tokenUsage = metric.estimatedTokens;
        apiCalls = metric.apiCalls;
        chartData = metric.hourlyTokens && metric.hourlyTokens.length === 24 
          ? metric.hourlyTokens 
          : Array(24).fill(0);
      }
    } else if (timeframe === 'day') {
      // Get last 7 days
      const d = new Date(targetDate);
      for (let i = 6; i >= 0; i--) {
        const checkDate = new Date(d);
        checkDate.setDate(d.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const metric = await SystemMetric.findOne({ date: dateStr });
        chartData.push(metric ? metric.estimatedTokens : 0);
        if (i === 0 && metric) {
          tokenUsage = metric.estimatedTokens;
          apiCalls = metric.apiCalls;
        }
      }
    } else if (timeframe === 'week') {
      // Get last 4 weeks
      const d = new Date(targetDate);
      for (let w = 3; w >= 0; w--) {
        const endD = new Date(d);
        endD.setDate(d.getDate() - (w * 7));
        const startD = new Date(endD);
        startD.setDate(endD.getDate() - 6);
        
        let weekTokens = 0;
        // Query metrics between startD and endD
        const metrics = await SystemMetric.find({
          date: { 
            $gte: startD.toISOString().split('T')[0], 
            $lte: endD.toISOString().split('T')[0] 
          }
        });
        
        metrics.forEach(m => weekTokens += m.estimatedTokens);
        chartData.push(weekTokens);
      }
      
      let currentMetric = await SystemMetric.findOne({ date: targetDate });
      if (currentMetric) {
        tokenUsage = currentMetric.estimatedTokens;
        apiCalls = currentMetric.apiCalls;
      }
    }

    res.json({
      success: true,
      data: {
        tokenUsage,
        apiCalls,
        health: '99.98%',
        tokenUsageChange: '+0%',
        chartData
      }
    });
  } catch (error) {
    console.error("Fetch Performance Error:", error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

module.exports = router;
