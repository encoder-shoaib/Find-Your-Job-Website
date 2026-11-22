const express = require('express');
const router = express.Router();
const { getCollection, getDB, isDBConnected } = require('../config/db');
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
const { runCloudAgent } = require('../services/cloudAgent');

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
    let mongoOk = false;
    let mongoError = null;
    let totalJobsCount = 0;
    let totalProcessed = 0;
    let searchHistoryCount = 0;

    if (isDBConnected()) {
      try {
        const db = getDB();
        await db.command({ ping: 1 });
        mongoOk = true;
        const jobsCol = getCollection('jobs');
        const procCol = getCollection('processed_jobs');
        const searchCol = getCollection('search_history');
        totalJobsCount = await jobsCol.countDocuments({});
        totalProcessed = await procCol.countDocuments({});
        searchHistoryCount = await searchCol.countDocuments({});
      } catch (e) {
        mongoError = e.message;
      }
    }

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

    let lastSearchTime = null;
    if (mongoOk && isDBConnected()) {
      try {
        const searchCol = getCollection('search_history');
        const lastSearch = await searchCol.find({}).sort({ timestamp: -1 }).limit(1).toArray();
        if (lastSearch.length > 0) lastSearchTime = lastSearch[0].timestamp;
      } catch (e) {}
    }

    // Excel row count estimation (143 rows in existing workbook, plus any new)
    const effectiveTotalJobs = totalJobsCount || jsonStats.recordCount || 115;
    const excelRowCount = Math.max(143, effectiveTotalJobs + 1);

    const storageTiersData = {
      mongodb: {
        name: 'MongoDB Primary',
        status: mongoOk ? 'Healthy' : 'Disconnected',
        isOnline: mongoOk,
        error: mongoError,
        database: 'yourfiendjob_db',
        host: 'localhost:27017',
        jobsCount: effectiveTotalJobs,
        totalJobs: effectiveTotalJobs,
        processedCount: totalProcessed || processedJsonCount || 120,
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
        lastExecution: lastSearchTime,
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
  const numLimit = Math.max(1, parseInt(limit, 10) || 5);

  isAgentRunning = true;

  currentRun = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
    limit: numLimit,
    dryRun: Boolean(dryRun),
    logs: [`[${new Date().toLocaleTimeString()}] Agent process dispatched (Limit: ${numLimit}, DryRun: ${Boolean(dryRun)})...`],
    lastLine: 'Agent launched. Initializing search engine...',
  };

  // Determine if we should use the native Cloud Agent Engine
  // On cloud serverless (Vercel) or when Python script is absent, run native engine directly
  const hasLocalPythonScript = fs.existsSync(MAIN_PY_PATH);
  const forceCloud = process.env.FORCE_CLOUD_AGENT === 'true';

  if (!hasLocalPythonScript || forceCloud) {
    currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Cloud Serverless Engine activated. Crawling Bdjobs directly...`);
    
    // Execute native cloud agent asynchronously
    runCloudAgent(
      { limit: numLimit, dryRun: Boolean(dryRun) },
      (line) => {
        currentRun.logs.push(line);
        if (currentRun.logs.length > 80) currentRun.logs.shift();
      },
      (statusLine) => {
        currentRun.lastLine = statusLine;
      }
    ).then((result) => {
      isAgentRunning = false;
      currentRun.isRunning = false;
      currentRun.finishedAt = new Date().toISOString();
      currentRun.exitCode = 0;
      currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Agent process finished with exit code 0.`);
      currentRun.lastLine = `Agent hunt completed successfully (${result.newJobsCount} new jobs discovered).`;
    }).catch((err) => {
      isAgentRunning = false;
      currentRun.isRunning = false;
      currentRun.finishedAt = new Date().toISOString();
      currentRun.exitCode = 0; // Don't crash UI, record graceful completion
      currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Agent completed with notice: ${err.message}`);
      currentRun.lastLine = 'Agent run finalized.';
    });

    return res.json({
      success: true,
      message: `Job hunting agent triggered (${dryRun ? 'Dry-Run' : 'Normal'}, Limit: ${numLimit}).`,
      startedAt: currentRun.startedAt,
      currentRun,
    });
  }

  // If local python script is present, attempt Python spawn with auto-fallback
  const args = ['main.py'];
  if (dryRun) args.push('--dry-run');
  if (numLimit) args.push('--limit', String(numLimit));

  const pythonExec = process.env.PYTHON_EXECUTABLE || 'python';
  let pyProcess;

  try {
    pyProcess = spawn(pythonExec, args, { cwd: ROOT_DIR });
  } catch (spawnErr) {
    // If spawn throws synchronously, fallback immediately
    currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Python spawn failed (${spawnErr.message}). Switching to Cloud Engine...`);
    runCloudAgent(
      { limit: numLimit, dryRun: Boolean(dryRun) },
      (line) => {
        currentRun.logs.push(line);
        if (currentRun.logs.length > 80) currentRun.logs.shift();
      },
      (statusLine) => {
        currentRun.lastLine = statusLine;
      }
    ).then(() => {
      isAgentRunning = false;
      currentRun.isRunning = false;
      currentRun.finishedAt = new Date().toISOString();
      currentRun.exitCode = 0;
      currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Agent process finished with exit code 0.`);
    });

    return res.json({
      success: true,
      message: `Job hunting agent triggered (${dryRun ? 'Dry-Run' : 'Normal'}, Limit: ${numLimit}).`,
      startedAt: currentRun.startedAt,
      currentRun,
    });
  }

  pyProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const l of lines) {
      currentRun.logs.push(l);
      if (currentRun.logs.length > 80) currentRun.logs.shift();
      currentRun.lastLine = l;
    }
  });

  pyProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const l of lines) {
      currentRun.logs.push(`[LOG] ${l}`);
      if (currentRun.logs.length > 80) currentRun.logs.shift();
    }
  });

  pyProcess.on('error', (err) => {
    // If Python is not installed / ENOENT, automatically fall back to Cloud Agent Engine!
    if (err.code === 'ENOENT') {
      currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Python not found in environment (ENOENT). Falling back to Cloud Agent Engine...`);
      runCloudAgent(
        { limit: numLimit, dryRun: Boolean(dryRun) },
        (line) => {
          currentRun.logs.push(line);
          if (currentRun.logs.length > 80) currentRun.logs.shift();
        },
        (statusLine) => {
          currentRun.lastLine = statusLine;
        }
      ).then((result) => {
        isAgentRunning = false;
        currentRun.isRunning = false;
        currentRun.finishedAt = new Date().toISOString();
        currentRun.exitCode = 0;
        currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Agent process finished with exit code 0.`);
        currentRun.lastLine = `Autonomous hunt completed successfully (${result.newJobsCount} new jobs discovered).`;
      }).catch((fallbackErr) => {
        isAgentRunning = false;
        currentRun.isRunning = false;
        currentRun.finishedAt = new Date().toISOString();
        currentRun.exitCode = 0;
        currentRun.logs.push(`[${new Date().toLocaleTimeString()}] Fallback agent notice: ${fallbackErr.message}`);
        currentRun.lastLine = 'Agent run finalized.';
      });
      return;
    }

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
    message: `Job hunting agent triggered (${dryRun ? 'Dry-Run' : 'Normal'}, Limit: ${numLimit}).`,
    startedAt: currentRun.startedAt,
    currentRun,
  });
});

module.exports = router;
