const fs = require('fs');
const path = require('path');
const { JOBS_JSON_PATH } = require('../config/paths');

// Persistent in-memory caches surviving within the serverless container
if (global.__JOBS_CACHE__ === undefined) {
  global.__JOBS_CACHE__ = null;
}
if (global.__SEARCH_HISTORY_CACHE__ === undefined) {
  global.__SEARCH_HISTORY_CACHE__ = [];
}
if (global.__AGENT_LOGS_CACHE__ === undefined) {
  global.__AGENT_LOGS_CACHE__ = [];
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
  global.__SEARCH_HISTORY_CACHE__ = [];
  global.__AGENT_LOGS_CACHE__ = [];
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

// --- Search History Cache ---
function addSearchHistory(entry) {
  if (!entry) return;
  const item = {
    timestamp: entry.timestamp || new Date().toISOString(),
    keywords: entry.keywords || ['Tech Jobs'],
    category_ids: entry.category_ids || [8],
    found_count: entry.found_count ?? entry.total_found ?? 0,
    new_count: entry.new_count ?? entry.new_jobs ?? 0,
    duplicates_skipped: entry.duplicates_skipped ?? 0,
    status: entry.status || 'Success',
    source: entry.source || 'Cloud Agent',
  };
  global.__SEARCH_HISTORY_CACHE__.unshift(item);
  if (global.__SEARCH_HISTORY_CACHE__.length > 50) {
    global.__SEARCH_HISTORY_CACHE__.pop();
  }
  return item;
}

function getSearchHistory(limit = 25) {
  const lim = parseInt(limit, 10) || 25;
  return global.__SEARCH_HISTORY_CACHE__.slice(0, lim);
}

// --- Agent Logs Cache ---
function addAgentLog(entry) {
  if (!entry) return;
  const item = {
    action: entry.action || 'AGENT_EVENT',
    message: entry.message || '',
    level: entry.level || 'INFO',
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  global.__AGENT_LOGS_CACHE__.unshift(item);
  if (global.__AGENT_LOGS_CACHE__.length > 100) {
    global.__AGENT_LOGS_CACHE__.pop();
  }
  return item;
}

function getAgentLogs(limit = 50) {
  const lim = parseInt(limit, 10) || 50;
  return global.__AGENT_LOGS_CACHE__.slice(0, lim);
}

module.exports = {
  getStoredJobs,
  setStoredJobs,
  clearAllStoredJobs,
  addJobs,
  addSearchHistory,
  getSearchHistory,
  addAgentLog,
  getAgentLogs,
};
