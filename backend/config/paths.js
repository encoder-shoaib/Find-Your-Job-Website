const path = require('path');
const fs = require('fs');

function getAgentDir() {
  if (process.env.AGENT_DIR && fs.existsSync(process.env.AGENT_DIR)) {
    return path.resolve(process.env.AGENT_DIR);
  }
  const siblingAgentDir = path.resolve(__dirname, '../../../YourFiendJob-AI-agent');
  if (fs.existsSync(siblingAgentDir)) {
    return siblingAgentDir;
  }
  const parentAgentDir = path.resolve(__dirname, '../../YourFiendJob-AI-agent');
  if (fs.existsSync(parentAgentDir)) {
    return parentAgentDir;
  }
  return path.resolve(__dirname, '../../');
}

const AGENT_DIR = getAgentDir();

module.exports = {
  AGENT_DIR,
  JOBS_JSON_PATH: path.join(AGENT_DIR, 'data/jobs.json'),
  JOBS_XLSX_PATH: path.join(AGENT_DIR, 'data/jobs.xlsx'),
  PROC_JSON_PATH: path.join(AGENT_DIR, 'data/processed_jobs.json'),
  LOG_FILE_PATH: path.join(AGENT_DIR, 'logs/yourfiendjob.log'),
  MAIN_PY_PATH: path.join(AGENT_DIR, 'main.py'),
  CONFIG_YAML_PATH: path.join(AGENT_DIR, 'config.yaml'),
};
