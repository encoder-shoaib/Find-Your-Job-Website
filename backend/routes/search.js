const express = require('express');
const router = express.Router();
const { getCollection, isDBConnected } = require('../config/db');
const { getSearchHistory } = require('../services/jobsStore');

// GET /api/search/history - List recorded search operations
router.get('/history', async (req, res) => {
  try {
    const { limit = 25 } = req.query;
    const limitNum = parseInt(limit, 10) || 25;

    let mongoHistory = [];
    if (isDBConnected()) {
      try {
        const col = getCollection('search_history');
        mongoHistory = await col
          .find({})
          .sort({ timestamp: -1 })
          .limit(limitNum)
          .toArray();
      } catch (e) {
        console.warn('[Search] MongoDB search_history read warning:', e.message);
      }
    }

    // If MongoDB has records, return them. Otherwise fall back to in-memory store
    const history = (mongoHistory && mongoHistory.length > 0)
      ? mongoHistory
      : getSearchHistory(limitNum);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Error in GET /api/search/history:', error);
    res.json({
      success: true,
      history: getSearchHistory(25),
    });
  }
});

module.exports = router;
