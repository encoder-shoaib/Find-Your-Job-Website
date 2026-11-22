const express = require('express');
const router = express.Router();
const { getCollection } = require('../config/db');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const { JOBS_JSON_PATH } = require('../config/paths');

// GET /api/jobs - Search, filter, sort and paginate jobs
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      priority,
      status,
      location,
      minScore,
      sort = 'score_desc',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Text search on title, company, skills, or description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { job_title: searchRegex },
        { company_name: searchRegex },
        { required_skills: searchRegex },
        { location: searchRegex },
      ];
    }

    if (category && category !== 'All') {
      query.job_category = category;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (status && status !== 'All') {
      if (status === 'Saved') {
        query.is_saved = true;
      } else {
        query.status = status;
      }
    }

    if (location && location !== 'All') {
      query.location = new RegExp(location.trim(), 'i');
    }

    if (minScore) {
      query.match_score = { $gte: parseInt(minScore, 10) };
    }

    // Require valid, available deadline: only deadline available jobs are queried
    const deadlineFilter = {
      $or: [
        { deadline: { $exists: true, $nin: ['', null, 'N/A', 'Not Stated', 'None'] } },
        { application_deadline: { $exists: true, $nin: ['', null, 'N/A', 'Not Stated', 'None'] } },
      ],
    };

    if (query.$or) {
      const searchOr = query.$or;
      delete query.$or;
      query.$and = [{ $or: searchOr }, deadlineFilter];
    } else {
      query.$and = [deadlineFilter];
    }

    // Determine sort order
    let sortOptions = { match_score: -1, date_found: -1 };
    if (sort === 'date_desc') {
      sortOptions = { date_found: -1, _id: -1 };
    } else if (sort === 'date_asc') {
      sortOptions = { date_found: 1 };
    } else if (sort === 'score_asc') {
      sortOptions = { match_score: 1 };
    } else if (sort === 'title_asc') {
      sortOptions = { job_title: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const col = getCollection('jobs');
    const total = await col.countDocuments(query);
    const rawJobs = await col
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Normalize job fields so deadline is guaranteed on every object
    const jobs = rawJobs.map((job) => {
      const dl = job.deadline || job.application_deadline || '';
      return {
        ...job,
        deadline: dl,
        application_deadline: dl,
      };
    });

    // Distinct metadata for filter dropdowns
    const categories = await col.distinct('job_category');
    const locations = await col.distinct('location');

    res.json({
      success: true,
      jobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      filters: {
        categories: categories.filter(Boolean),
        locations: locations.filter(Boolean).slice(0, 20),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/jobs/:id - Get single job details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const col = getCollection('jobs');

    let job = null;
    if (ObjectId.isValid(id)) {
      job = await col.findOne({ _id: new ObjectId(id) });
    }
    if (!job) {
      job = await col.findOne({ job_id: id });
    }

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error('Error in GET /api/jobs/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/jobs/:id/status - Update job status or bookmark
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_saved } = req.body;
    const col = getCollection('jobs');

    const updateFields = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateFields.status = status;
    if (is_saved !== undefined) updateFields.is_saved = is_saved;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { job_id: id }] }
      : { job_id: id };

    const result = await col.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Also update local JSON file if exists
    try {
      if (fs.existsSync(JOBS_JSON_PATH)) {
        const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
        const jsonJobs = JSON.parse(raw);
        let changed = false;
        for (const j of jsonJobs) {
          if (j.job_id === result.job_id) {
            if (status !== undefined) j.status = status;
            if (is_saved !== undefined) j.is_saved = is_saved;
            changed = true;
          }
        }
        if (changed) {
          fs.writeFileSync(JOBS_JSON_PATH, JSON.stringify(jsonJobs, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      console.warn('Could not update JSON file:', e.message);
    }

    res.json({ success: true, job: result });
  } catch (error) {
    console.error('Error in PATCH /api/jobs/:id/status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const { requireAdmin } = require('../middleware/auth');

// PUT /api/jobs/:id - Edit job details (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      company,
      category,
      location,
      salary,
      experience,
      match_score,
      priority,
      status,
      skills,
      description,
      match_reason,
    } = req.body;

    const col = getCollection('jobs');
    const updateFields = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updateFields.job_title = title;
      updateFields.title = title;
    }
    if (company !== undefined) {
      updateFields.company_name = company;
      updateFields.company = company;
    }
    if (category !== undefined) {
      updateFields.job_category = category;
      updateFields.category = category;
    }
    if (location !== undefined) updateFields.location = location;
    if (salary !== undefined) updateFields.salary = salary;
    if (experience !== undefined) updateFields.experience = experience;
    if (match_score !== undefined) updateFields.match_score = parseInt(match_score, 10);
    if (priority !== undefined) updateFields.priority = priority;
    if (status !== undefined) updateFields.status = status;
    if (skills !== undefined) {
      updateFields.required_skills = Array.isArray(skills) ? skills.join(', ') : skills;
      updateFields.skills = skills;
    }
    if (description !== undefined) {
      updateFields.job_description = description;
      updateFields.description = description;
    }
    if (match_reason !== undefined) updateFields.match_reason = match_reason;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { job_id: id }] }
      : { job_id: id };

    const result = await col.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, message: 'Job updated successfully.', job: normalizeJob(result) });
  } catch (error) {
    console.error('Error in PUT /api/jobs/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/jobs/:id - Delete job (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const col = getCollection('jobs');
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { job_id: id }] }
      : { job_id: id };

    const targetJob = await col.findOne(filter);
    if (!targetJob) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await col.deleteOne(filter);

    // Also remove from local JSON file if present
    try {
      if (fs.existsSync(JOBS_JSON_PATH)) {
        const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
        const jsonJobs = JSON.parse(raw);
        const filtered = jsonJobs.filter(
          (j) => j.job_id !== targetJob.job_id && (!targetJob._id || j._id !== targetJob._id.toString())
        );
        fs.writeFileSync(JOBS_JSON_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('Could not delete from JSON file:', e.message);
    }

    res.json({ success: true, message: 'Job deleted successfully from MongoDB and backup storage.' });
  } catch (error) {
    console.error('Error in DELETE /api/jobs/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

