const path = require('path');
const fs = require('fs');

const localDataDir = path.resolve(__dirname, '../data');

const candidateAgentDirs = [
  path.resolve(__dirname, '../../../YourFindJob-AI-agent'),
  path.resolve(__dirname, '../../../YourFiendJob-AI-agent'),
  path.resolve(__dirname, '../../YourFindJob-AI-agent'),
  path.resolve(__dirname, '../../YourFiendJob-AI-agent'),
];

function getAgentDir() {
  if (process.env.AGENT_DIR && fs.existsSync(process.env.AGENT_DIR)) {
    return path.resolve(process.env.AGENT_DIR);
  }
  for (const dir of candidateAgentDirs) {
    if (fs.existsSync(dir)) return dir;
  }
  return path.resolve(__dirname, '../..');
}

const AGENT_DIR = getAgentDir();

function resolveDataFile(fileName) {
  const localPath = path.join(localDataDir, fileName);
  if (fs.existsSync(localPath)) return localPath;

  const agentDataPath = path.join(AGENT_DIR, 'data', fileName);
  if (fs.existsSync(agentDataPath)) return agentDataPath;

  return localPath;
}

function resolveLogFile() {
  const newLog = path.join(AGENT_DIR, 'logs/yourfindjob.log');
  if (fs.existsSync(newLog)) return newLog;
  const oldLog = path.join(AGENT_DIR, 'logs/yourfiendjob.log');
  if (fs.existsSync(oldLog)) return oldLog;
  return newLog;
}

module.exports = {
  AGENT_DIR,
  DATA_DIR: localDataDir,
  JOBS_JSON_PATH: resolveDataFile('jobs.json'),
  JOBS_XLSX_PATH: resolveDataFile('jobs.xlsx'),
  PROC_JSON_PATH: resolveDataFile('processed_jobs.json'),
  LOG_FILE_PATH: resolveLogFile(),
  MAIN_PY_PATH: path.join(AGENT_DIR, 'main.py'),
  CONFIG_YAML_PATH: path.join(AGENT_DIR, 'config.yaml'),
};
