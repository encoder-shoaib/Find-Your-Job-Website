const express = require('express');
const router = express.Router();
const { getCollection, isDBConnected } = require('../config/db');
const fs = require('fs');
const { JOBS_JSON_PATH } = require('../config/paths');
const { getStoredJobs } = require('../services/jobsStore');

function loadJobsFromJSON() {
  const jobs = getStoredJobs();
  return Array.isArray(jobs) ? jobs : [];
}

// GET /api/dashboard/stats - Overall stats, metrics, distributions, and recent jobs (Zero-Fail Guarantee)
router.get('/stats', async (req, res) => {
  if (isDBConnected()) {
    try {
      const jobsCol = getCollection('jobs');
      const procCol = getCollection('processed_jobs');
      const searchCol = getCollection('search_history');

      const totalJobs = await jobsCol.countDocuments({});
      const highPriority = await jobsCol.countDocuments({ priority: 'High' });
      const mediumPriority = await jobsCol.countDocuments({ priority: 'Medium' });
      const lowPriority = await jobsCol.countDocuments({ priority: 'Low' });
      const savedJobs = await jobsCol.countDocuments({ is_saved: true });

      const todayStr = new Date().toISOString().slice(0, 10);
      const newToday = await jobsCol.countDocuments({
        $or: [
          { date_found: new RegExp(`^${todayStr}`) },
          { created_at: new RegExp(`^${todayStr}`) },
        ],
      });

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

      const scoreBuckets = {
        excellent: await jobsCol.countDocuments({ match_score: { $gte: 9 } }),
        high: await jobsCol.countDocuments({ match_score: { $in: [7, 8] } }),
        medium: await jobsCol.countDocuments({ match_score: { $in: [5, 6] } }),
        low: await jobsCol.countDocuments({ match_score: { $lt: 5 } }),
      };

      const recentJobs = await jobsCol
        .find({})
        .sort({ date_found: -1, match_score: -1 })
        .limit(6)
        .toArray();

      const lastSearch = await searchCol.find({}).sort({ timestamp: -1 }).limit(1).toArray();

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

      return res.json({
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
        source: 'mongodb',
      });
    } catch (err) {
      console.warn('[Dashboard] MongoDB stats error, falling back to local JSON:', err.message);
    }
  }

  // Fallback: Compute stats from local JSON backup
  const allJobs = loadJobsFromJSON();
  const totalJobs = allJobs.length;
  const highPriority = allJobs.filter((j) => (j.priority || '').toLowerCase() === 'high').length;
  const mediumPriority = allJobs.filter((j) => (j.priority || '').toLowerCase() === 'medium').length;
  const lowPriority = allJobs.filter((j) => (j.priority || '').toLowerCase() === 'low').length;
  const savedJobs = allJobs.filter((j) => j.is_saved === true).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const newToday = allJobs.filter((j) => {
    const d = j.date_found || j.created_at || '';
    return d.startsWith(todayStr);
  }).length;

  const catCounts = {};
  allJobs.forEach((j) => {
    const c = j.job_category || 'General Tech';
    catCounts[c] = (catCounts[c] || 0) + 1;
  });

  const categoryDistribution = Object.entries(catCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const scoreBuckets = {
    excellent: allJobs.filter((j) => (j.match_score || 0) >= 9).length,
    high: allJobs.filter((j) => [7, 8].includes(j.match_score || 0)).length,
    medium: allJobs.filter((j) => [5, 6].includes(j.match_score || 0)).length,
    low: allJobs.filter((j) => (j.match_score || 0) < 5).length,
  };

  const recentJobs = [...allJobs]
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
    .slice(0, 6);

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
    categoryDistribution: catCounts,
    recentJobs,
    totalProcessedHistory: totalJobs,
    lastExecution: allJobs.length > 0 ? (allJobs[0].date_found || null) : null,
  };

  return res.json({
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
    source: 'json_fallback',
  });
});

module.exports = router;
