const express = require('express');
const router = express.Router();
const { getCollection, getDB } = require('../config/db');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const {
  AGENT_DIR: ROOT_DIR,
  JOBS_JSON_PATH,
  JOBS_XLSX_PATH,
  PROC_JSON_PATH,
  LOG_FILE_PATH,
  MAIN_PY_PATH,
} = require('../config/paths');

const { requireAdmin } = require('../middleware/auth');

let isAgentRunning = false;
let currentRun = {
  isRunning: false,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  limit: 5,
  dryRun: true,
  logs: [],
  lastLine: 'Agent idle.',
};

// GET /api/agent/status - Storage tiers, health, and execution state
router.get('/status', async (req, res) => {
  try {
    const jobsCol = getCollection('jobs');
    const procCol = getCollection('processed_jobs');
    const searchCol = getCollection('search_history');
    const db = getDB();

    // MongoDB status
    let mongoOk = false;
    let mongoError = null;
    try {
      await db.command({ ping: 1 });
      mongoOk = true;
    } catch (e) {
      mongoError = e.message;
    }

    const totalJobsCount = await jobsCol.countDocuments({});

    // JSON backup status
    const jsonExists = fs.existsSync(JOBS_JSON_PATH);
    let jsonStats = { exists: false, sizeBytes: 0, lastModified: null, recordCount: 0 };
    if (jsonExists) {
      const stat = fs.statSync(JOBS_JSON_PATH);
      let count = 0;
      try {
        const raw = fs.readFileSync(JOBS_JSON_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        count = Array.isArray(parsed) ? parsed.length : (parsed.jobs ? parsed.jobs.length : 0);
      } catch (err) {}
      jsonStats = {
        exists: true,
        sizeBytes: stat.size,
        lastModified: stat.mtime.toISOString(),
        recordCount: count,
      };
    }

    // Excel report status
    const excelExists = fs.existsSync(JOBS_XLSX_PATH);
    let excelStats = { exists: false, sizeBytes: 0, lastModified: null };
    if (excelExists) {
      const stat = fs.statSync(JOBS_XLSX_PATH);
      excelStats = {
        exists: true,
        sizeBytes: stat.size,
        lastModified: stat.mtime.toISOString(),
      };
    }

    // Processed jobs count
    let processedJsonCount = 0;
    if (fs.existsSync(PROC_JSON_PATH)) {
      try {
        const pRaw = fs.readFileSync(PROC_JSON_PATH, 'utf-8');
        const pData = JSON.parse(pRaw);
        processedJsonCount = pData.jobs ? Object.keys(pData.jobs).length : 0;
      } catch (err) {}
    }

    const lastSearch = await searchCol.find({}).sort({ timestamp: -1 }).limit(1).toArray();

    // Excel row count estimation (143 rows in existing workbook, plus any new)
    const excelRowCount = Math.max(143, totalJobsCount + 1);

    const storageTiersData = {
      mongodb: {
        name: 'MongoDB Primary',
        status: mongoOk ? 'Healthy' : 'Disconnected',
        isOnline: mongoOk,
        error: mongoError,
        database: db.databaseName,
        host: 'localhost:27017',
        jobsCount: totalJobsCount,
        totalJobs: totalJobsCount,
        processedCount: await procCol.countDocuments({}),
      },
      jsonBackup: {
        name: 'JSON Local Backup',
        status: jsonExists ? 'Active' : 'Missing',
        path: 'data/jobs.json',
        recordCount: jsonStats.recordCount,
        totalJobs: jsonStats.recordCount,
        fileSizeKB: Math.max(1, Math.round(jsonStats.sizeBytes / 1024)),
        ...jsonStats,
      },
      excelReport: {
        name: 'Excel Report',
        status: excelExists ? 'Active' : 'Missing',
        path: 'data/jobs.xlsx',
        totalRows: excelRowCount,
        fileSizeKB: Math.max(1, Math.round(excelStats.sizeBytes / 1024)),
        ...excelStats,
      },
      excel: {
        name: 'Excel Report',
        status: excelExists ? 'Active' : 'Missing',
        path: 'data/jobs.xlsx',
        totalRows: excelRowCount,
        fileSizeKB: Math.max(1, Math.round(excelStats.sizeBytes / 1024)),
        ...excelStats,
      },
    };

    res.json({
      success: true,
      agent: {
        isRunning: isAgentRunning,
        status: isAgentRunning ? 'Running' : 'Idle',
        frequency: 'Daily (8:00 AM Asia/Dhaka)',
        lastExecution: lastSearch.length > 0 ? lastSearch[0].timestamp : null,
        currentRun,
      },
      storageTiers: storageTiersData,
      stats: {
        totalDiscovered: totalJobsCount,
        totalTrackedProcessed: processedJsonCount,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/agent/status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agent/logs - Fetch recent execution logs from MongoDB & local log file
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logsCol = getCollection('agent_logs');
    const mongoLogs = await logsCol
      .find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .toArray();

    // Also get last 30 lines from local file log if available
    let fileLogs = [];
    if (fs.existsSync(LOG_FILE_PATH)) {
      try {
        const content = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        fileLogs = lines.slice(-30).reverse();
      } catch (e) {}
    }

    res.json({
      success: true,
      logs: mongoLogs,
      fileLogs,
    });
  } catch (error) {
    console.error('Error in GET /api/agent/logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/run - Trigger an on-demand job hunt run from the dashboard (Admin only)
router.post('/run', requireAdmin, (req, res) => {
  if (isAgentRunning) {
    return res.status(409).json({ 
      success: false, 
      message: 'Agent is already actively running. Please wait for current search to finish.',
      currentRun 
    });
  }

  const { limit = 5, dryRun = true } = req.body;
  const args = ['main.py'];
  if (dryRun) args.push('--dry-run');
  if (limit) {
    args.push('--limit', String(limit));
  }

  isAgentRunning = true;
  let stdoutData = '';
  let stderrData = '';

  currentRun = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
    limit,
    dryRun,
    logs: [`[${new Date().toLocaleTimeString()}] Agent process spawned (Limit: ${limit}, DryRun: ${dryRun})...`],
    lastLine: 'Agent launched. Querying Bdjobs API...',
  };

  const pythonExec = process.env.PYTHON_EXECUTABLE || 'python';
  const pyProcess = spawn(pythonExec, args, { cwd: ROOT_DIR });

  pyProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdoutData += text;
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const l of lines) {
      currentRun.logs.push(l);
      if (currentRun.logs.length > 80) currentRun.logs.shift();
      currentRun.lastLine = l;
    }
  });

  pyProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrData += text;
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const l of lines) {
      currentRun.logs.push(`[LOG] ${l}`);
      if (currentRun.logs.length > 80) currentRun.logs.shift();
    }
  });

  pyProcess.on('error', (err) => {
    isAgentRunning = false;
    currentRun.isRunning = false;
    currentRun.finishedAt = new Date().toISOString();
    currentRun.exitCode = 1;
    currentRun.logs.push(`[ERROR] Failed to spawn process: ${err.message}`);
    currentRun.lastLine = `Error spawning python: ${err.message}`;
  });

  pyProcess.on('close', (code) => {
    isAgentRunning = false;
    currentRun.isRunning = false;
    currentRun.finishedAt = new Date().toISOString();
    currentRun.exitCode = code;
    currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Agent process finished with exit code ${code}.`);
    currentRun.lastLine = code === 0 ? 'Agent run completed successfully.' : `Process exited with code ${code}.`;
  });

  // Respond immediately that the run has started
  res.json({
    success: true,
    message: `Job hunting agent triggered (${dryRun ? 'Dry-Run' : 'Normal'}, Limit: ${limit}).`,
    startedAt: currentRun.startedAt,
    currentRun,
  });
});

module.exports = router;
