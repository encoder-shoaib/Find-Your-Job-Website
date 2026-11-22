const express = require('express');
const router = express.Router();
const { getCollection } = require('../config/db');

// GET /api/dashboard/stats - Overall stats, metrics, distributions, and recent jobs
router.get('/stats', async (req, res) => {
  try {
    const jobsCol = getCollection('jobs');
    const procCol = getCollection('processed_jobs');
    const searchCol = getCollection('search_history');

    const totalJobs = await jobsCol.countDocuments({});
    const highPriority = await jobsCol.countDocuments({ priority: 'High' });
    const mediumPriority = await jobsCol.countDocuments({ priority: 'Medium' });
    const lowPriority = await jobsCol.countDocuments({ priority: 'Low' });
    const savedJobs = await jobsCol.countDocuments({ is_saved: true });

    // Jobs found today (UTC/local date string match)
    const todayStr = new Date().toISOString().slice(0, 10);
    const newToday = await jobsCol.countDocuments({
      $or: [
        { date_found: new RegExp(`^${todayStr}`) },
        { created_at: new RegExp(`^${todayStr}`) },
      ],
    });

    // Category distribution
    const categoryAgg = await jobsCol
      .aggregate([
        { $group: { _id: '$job_category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const categoryDistribution = categoryAgg.map((c) => ({
      name: c._id || 'General Tech',
      count: c.count,
    }));

    // Score distribution (brackets: 9-10, 7-8, 5-6, 1-4)
    const scoreBuckets = {
      excellent: await jobsCol.countDocuments({ match_score: { $gte: 9 } }),
      high: await jobsCol.countDocuments({ match_score: { $in: [7, 8] } }),
      medium: await jobsCol.countDocuments({ match_score: { $in: [5, 6] } }),
      low: await jobsCol.countDocuments({ match_score: { $lt: 5 } }),
    };

    // 6 most recent top matching jobs
    const recentJobs = await jobsCol
      .find({})
      .sort({ date_found: -1, match_score: -1 })
      .limit(6)
      .toArray();

    // Last search history entry
    const lastSearch = await searchCol.find({}).sort({ timestamp: -1 }).limit(1).toArray();

    // Convert category distribution array to dictionary for frontend components
    const categoryMap = {};
    categoryDistribution.forEach((c) => {
      categoryMap[c.name] = c.count;
    });

    const priorityMap = {
      High: highPriority,
      Medium: mediumPriority,
      Low: lowPriority,
      high: highPriority,
      medium: mediumPriority,
      low: lowPriority,
    };

    const statsPayload = {
      totalJobs,
      newToday,
      newJobsToday: newToday,
      highPriority,
      highPriorityJobs: highPriority,
      mediumPriority,
      lowPriority,
      savedJobs,
      priorityDistribution: priorityMap,
      categoryDistribution: categoryMap,
      recentJobs,
      totalProcessedHistory: await procCol.countDocuments({}),
      lastExecution: lastSearch.length > 0 ? lastSearch[0].timestamp : null,
    };

    res.json({
      success: true,
      stats: statsPayload,
      distributions: {
        categories: categoryDistribution,
        priorities: [
          { label: 'High Priority', count: highPriority, color: '#10B981' },
          { label: 'Medium Priority', count: mediumPriority, color: '#F59E0B' },
          { label: 'Low Priority', count: lowPriority, color: '#6B7280' },
        ],
        scoreBuckets,
      },
      recentJobs,
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
