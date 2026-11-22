const fs = require('fs');
const path = require('path');
const { JOBS_JSON_PATH } = require('../config/paths');

// Persistent in-memory cache surviving within the Node.js server container
if (global.__JOBS_CACHE__ === undefined) {
  global.__JOBS_CACHE__ = null;
}

function loadInitialJobs() {
  if (global.__JOBS_CACHE__ !== null) {
    return global.__JOBS_CACHE__;
  }
  if (!fs.existsSync(JOBS_JSON_PATH)) {
    global.__JOBS_CACHE__ = [];
    return [];
  }
  try {
    const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    global.__JOBS_CACHE__ = Array.isArray(parsed) ? parsed : (parsed.jobs || []);
  } catch (err) {
    global.__JOBS_CACHE__ = [];
  }
  return global.__JOBS_CACHE__;
}

function getStoredJobs() {
  if (global.__JOBS_CACHE__ === null) {
    return loadInitialJobs();
  }
  return global.__JOBS_CACHE__;
}

function setStoredJobs(jobsArray) {
  global.__JOBS_CACHE__ = Array.isArray(jobsArray) ? jobsArray : [];
  try {
    fs.writeFileSync(JOBS_JSON_PATH, JSON.stringify(global.__JOBS_CACHE__, null, 2), 'utf-8');
  } catch (err) {
    // In serverless read-only filesystem, in-memory cache retains the state
  }
}

function clearAllStoredJobs() {
  global.__JOBS_CACHE__ = [];
  try {
    fs.writeFileSync(JOBS_JSON_PATH, '[]', 'utf-8');
  } catch (err) {}
  return [];
}

function addJobs(newJobs) {
  const current = getStoredJobs();
  const seen = new Set(current.map((j) => String(j.job_id)));
  const toAdd = [];
  for (const j of newJobs) {
    const id = String(j.job_id);
    if (!seen.has(id)) {
      seen.add(id);
      toAdd.push(j);
    }
  }
  const merged = [...toAdd, ...current];
  setStoredJobs(merged);
  return merged;
}

module.exports = {
  getStoredJobs,
  setStoredJobs,
  clearAllStoredJobs,
  addJobs,
};
