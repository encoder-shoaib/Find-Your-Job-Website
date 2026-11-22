const express = require('express');
const router = express.Router();
const { getCollection } = require('../config/db');

// GET /api/search/history - List recorded search operations
router.get('/history', async (req, res) => {
  try {
    const { limit = 25 } = req.query;
    const col = getCollection('search_history');
    const history = await col
      .find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .toArray();

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Error in GET /api/search/history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
