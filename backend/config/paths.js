const path = require('path');
const fs = require('fs');

const localDataDir = path.resolve(__dirname, '../data');
const siblingAgentDataDir = path.resolve(__dirname, '../../../YourFiendJob-AI-agent/data');
const parentAgentDataDir = path.resolve(__dirname, '../../YourFiendJob-AI-agent/data');

function resolveDataFile(fileName) {
  const localPath = path.join(localDataDir, fileName);
  if (fs.existsSync(localPath)) return localPath;

  const siblingPath = path.join(siblingAgentDataDir, fileName);
  if (fs.existsSync(siblingPath)) return siblingPath;

  const parentPath = path.join(parentAgentDataDir, fileName);
  if (fs.existsSync(parentPath)) return parentPath;

  return localPath;
}

function getAgentDir() {
  if (process.env.AGENT_DIR && fs.existsSync(process.env.AGENT_DIR)) {
    return path.resolve(process.env.AGENT_DIR);
  }
  const siblingAgentDir = path.resolve(__dirname, '../../../YourFiendJob-AI-agent');
  if (fs.existsSync(siblingAgentDir)) return siblingAgentDir;

  const parentAgentDir = path.resolve(__dirname, '../../YourFiendJob-AI-agent');
  if (fs.existsSync(parentAgentDir)) return parentAgentDir;

  return path.resolve(__dirname, '../..');
}

const AGENT_DIR = getAgentDir();

module.exports = {
  AGENT_DIR,
  DATA_DIR: localDataDir,
  JOBS_JSON_PATH: resolveDataFile('jobs.json'),
  JOBS_XLSX_PATH: resolveDataFile('jobs.xlsx'),
  PROC_JSON_PATH: resolveDataFile('processed_jobs.json'),
  LOG_FILE_PATH: path.join(AGENT_DIR, 'logs/yourfiendjob.log'),
  MAIN_PY_PATH: path.join(AGENT_DIR, 'main.py'),
  CONFIG_YAML_PATH: path.join(AGENT_DIR, 'config.yaml'),
};
