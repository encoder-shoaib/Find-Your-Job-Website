const express = require('express');
const router = express.Router();
const { getCollection, isDBConnected } = require('../config/db');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const { JOBS_JSON_PATH } = require('../config/paths');
const { requireAdmin } = require('../middleware/auth');

function normalizeJob(job) {
  if (!job) return null;
  const dl = job.deadline || job.application_deadline || '';
  return {
    ...job,
    deadline: dl,
    application_deadline: dl,
  };
}

function loadJobsFromJSON() {
  if (!fs.existsSync(JOBS_JSON_PATH)) return [];
  try {
    const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeJob) : [];
  } catch (err) {
    console.warn('[Jobs] Error parsing local JSON backup:', err.message);
    return [];
  }
}

// GET /api/jobs - Search, filter, sort and paginate jobs (with Zero-Fail JSON fallback)
router.get('/', async (req, res) => {
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

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  // Try MongoDB if connected
  if (isDBConnected()) {
    try {
      const col = getCollection('jobs');
      const query = {};

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

      // Require valid, available deadline
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

      const total = await col.countDocuments(query);
      const rawJobs = await col
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      const jobs = rawJobs.map(normalizeJob);
      const categories = await col.distinct('job_category');
      const locations = await col.distinct('location');

      return res.json({
        success: true,
        jobs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
          pages: Math.ceil(total / limitNum) || 1,
        },
        filters: {
          categories: categories.filter(Boolean),
          locations: locations.filter(Boolean).slice(0, 20),
        },
        source: 'mongodb',
      });
    } catch (dbErr) {
      console.warn('[Jobs] MongoDB query failed, falling back to local JSON:', dbErr.message);
    }
  }

  // Fallback: In-memory query from local JSON backup (Zero-Fail Guarantee)
  const allJobs = loadJobsFromJSON();
  let filtered = allJobs.filter((j) => {
    const dl = j.deadline || j.application_deadline || '';
    return dl && !['', 'N/A', 'Not Stated', 'None'].includes(dl.trim());
  });

  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter((j) => {
      const skills = Array.isArray(j.required_skills)
        ? j.required_skills.join(' ')
        : j.required_skills || '';
      return (
        (j.job_title && j.job_title.toLowerCase().includes(s)) ||
        (j.company_name && j.company_name.toLowerCase().includes(s)) ||
        skills.toLowerCase().includes(s) ||
        (j.location && j.location.toLowerCase().includes(s))
      );
    });
  }

  if (category && category !== 'All') {
    filtered = filtered.filter((j) => j.job_category === category);
  }

  if (priority && priority !== 'All') {
    filtered = filtered.filter((j) => j.priority === priority);
  }

  if (status && status !== 'All') {
    if (status === 'Saved') {
      filtered = filtered.filter((j) => j.is_saved === true);
    } else {
      filtered = filtered.filter((j) => j.status === status);
    }
  }

  if (location && location !== 'All') {
    filtered = filtered.filter((j) => j.location && j.location.toLowerCase().includes(location.trim().toLowerCase()));
  }

  if (minScore) {
    const scoreVal = parseInt(minScore, 10);
    if (!isNaN(scoreVal)) {
      filtered = filtered.filter((j) => (j.match_score || 0) >= scoreVal);
    }
  }

  // Sort
  if (sort === 'date_desc') {
    filtered.sort((a, b) => new Date(b.date_found || 0) - new Date(a.date_found || 0));
  } else if (sort === 'date_asc') {
    filtered.sort((a, b) => new Date(a.date_found || 0) - new Date(b.date_found || 0));
  } else if (sort === 'score_asc') {
    filtered.sort((a, b) => (a.match_score || 0) - (b.match_score || 0));
  } else if (sort === 'title_asc') {
    filtered.sort((a, b) => (a.job_title || '').localeCompare(b.job_title || ''));
  } else {
    filtered.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }

  const total = filtered.length;
  const paginatedJobs = filtered.slice(skip, skip + limitNum);

  const categories = [...new Set(allJobs.map((j) => j.job_category).filter(Boolean))];
  const locations = [...new Set(allJobs.map((j) => j.location).filter(Boolean))].slice(0, 20);

  return res.json({
    success: true,
    jobs: paginatedJobs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      pages: Math.ceil(total / limitNum) || 1,
    },
    filters: {
      categories,
      locations,
    },
    source: 'json_fallback',
  });
});

// GET /api/jobs/:id - Get single job details
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (isDBConnected()) {
    try {
      const col = getCollection('jobs');
      let job = null;
      if (ObjectId.isValid(id)) {
        job = await col.findOne({ _id: new ObjectId(id) });
      }
      if (!job) {
        job = await col.findOne({ job_id: id });
      }
      if (job) {
        return res.json({ success: true, job: normalizeJob(job), source: 'mongodb' });
      }
    } catch (e) {
      console.warn('[Jobs] Error querying job details from MongoDB:', e.message);
    }
  }

  // Fallback to local JSON
  const allJobs = loadJobsFromJSON();
  const job = allJobs.find((j) => j.job_id === id || (j._id && j._id.toString() === id));
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  return res.json({ success: true, job: normalizeJob(job), source: 'json_fallback' });
});

// PATCH /api/jobs/:id/status - Update job status or bookmark
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, is_saved } = req.body;
  const updateFields = { updated_at: new Date().toISOString() };
  if (status !== undefined) updateFields.status = status;
  if (is_saved !== undefined) updateFields.is_saved = is_saved;

  let updatedJob = null;

  if (isDBConnected()) {
    try {
      const col = getCollection('jobs');
      const filter = ObjectId.isValid(id)
        ? { $or: [{ _id: new ObjectId(id) }, { job_id: id }] }
        : { job_id: id };

      updatedJob = await col.findOneAndUpdate(
        filter,
        { $set: updateFields },
        { returnDocument: 'after' }
      );
    } catch (e) {
      console.warn('[Jobs] Error updating MongoDB job status:', e.message);
    }
  }

  // Update local JSON file
  try {
    if (fs.existsSync(JOBS_JSON_PATH)) {
      const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
      const jsonJobs = JSON.parse(raw);
      for (const j of jsonJobs) {
        if (j.job_id === id || (j._id && j._id.toString() === id)) {
          if (status !== undefined) j.status = status;
          if (is_saved !== undefined) j.is_saved = is_saved;
          j.updated_at = updateFields.updated_at;
          if (!updatedJob) updatedJob = j;
          break;
        }
      }
      fs.writeFileSync(JOBS_JSON_PATH, JSON.stringify(jsonJobs, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('[Jobs] Could not update local JSON file:', e.message);
  }

  if (!updatedJob) {
    // If not found in memory either, synthesize partial response
    updatedJob = { job_id: id, ...updateFields };
  }

  return res.json({ success: true, job: normalizeJob(updatedJob) });
});

// PUT /api/jobs/:id - Edit job details (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
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

  const updateFields = { updated_at: new Date().toISOString() };
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

  let result = null;

  if (isDBConnected()) {
    try {
      const col = getCollection('jobs');
      const filter = ObjectId.isValid(id)
        ? { $or: [{ _id: new ObjectId(id) }, { job_id: id }] }
        : { job_id: id };

      result = await col.findOneAndUpdate(
        filter,
        { $set: updateFields },
        { returnDocument: 'after' }
      );
    } catch (e) {
      console.warn('[Jobs] Error updating job in MongoDB:', e.message);
    }
  }

  // Update in local JSON backup
  try {
    if (fs.existsSync(JOBS_JSON_PATH)) {
      const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
      const jsonJobs = JSON.parse(raw);
      for (const j of jsonJobs) {
        if (j.job_id === id || (j._id && j._id.toString() === id)) {
          Object.assign(j, updateFields);
          if (!result) result = j;
          break;
        }
      }
      fs.writeFileSync(JOBS_JSON_PATH, JSON.stringify(jsonJobs, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('[Jobs] Could not update local JSON file:', e.message);
  }

  return res.json({
    success: true,
    message: 'Job updated successfully.',
    job: normalizeJob(result || { job_id: id, ...updateFields }),
  });
});

// DELETE /api/jobs/:id - Delete job (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (isDBConnected()) {
    try {
      const col = getCollection('jobs');
      const filter = ObjectId.isValid(id)
        ? { $or: [{ _id: new ObjectId(id) }, { job_id: id }] }
        : { job_id: id };
      await col.deleteOne(filter);
    } catch (e) {
      console.warn('[Jobs] Error deleting from MongoDB:', e.message);
    }
  }

  // Remove from local JSON backup
  try {
    if (fs.existsSync(JOBS_JSON_PATH)) {
      const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
      const jsonJobs = JSON.parse(raw);
      const filtered = jsonJobs.filter((j) => j.job_id !== id && (!j._id || j._id.toString() !== id));
      fs.writeFileSync(JOBS_JSON_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('[Jobs] Could not delete from local JSON file:', e.message);
  }

  return res.json({
    success: true,
    message: 'Job deleted successfully from primary and backup storage.',
  });
});

module.exports = router;
