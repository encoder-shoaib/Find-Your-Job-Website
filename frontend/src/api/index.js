import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yourfiendjob_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth APIs ---
export const loginUser = async (usernameOrEmail, password) => {
  const res = await api.post('/auth/login', { usernameOrEmail, password });
  if (res.data.token) {
    localStorage.setItem('yourfiendjob_token', res.data.token);
  }
  return res.data;
};

export const registerUser = async (data) => {
  const res = await api.post('/auth/register', data);
  if (res.data.token) {
    localStorage.setItem('yourfiendjob_token', res.data.token);
  }
  return res.data;
};

export const fetchCurrentUser = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const fetchDemoCredentials = async () => {
  const res = await api.get('/auth/demo-credentials');
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem('yourfiendjob_token');
};

// --- Job APIs ---
export const fetchJobs = async (params = {}) => {
  const res = await api.get('/jobs', { params });
  return res.data;
};

export const fetchJobDetails = async (id) => {
  const res = await api.get(`/jobs/${id}`);
  return res.data;
};

export const updateJobStatus = async (id, data) => {
  const res = await api.patch(`/jobs/${id}/status`, data);
  return res.data;
};

export const updateJob = async (id, data) => {
  const res = await api.put(`/jobs/${id}`, data);
  return res.data;
};

export const deleteJob = async (id) => {
  const res = await api.delete(`/jobs/${id}`);
  return res.data;
};

export const clearAllJobs = async () => {
  const res = await api.post('/jobs/clear-all');
  return res.data;
};

// --- Dashboard & Analytics APIs ---
export const fetchDashboardStats = async () => {
  const res = await api.get('/dashboard/stats');
  return res.data;
};

// --- Agent & Audit APIs ---
export const fetchAgentStatus = async () => {
  const res = await api.get('/agent/status');
  return res.data;
};

export const fetchAgentLogs = async (limit = 50) => {
  const res = await api.get('/agent/logs', { params: { limit } });
  return res.data;
};

export const fetchSearchHistory = async (limit = 25) => {
  const res = await api.get('/search/history', { params: { limit } });
  return res.data;
};

export const triggerAgentRun = async (data = { limit: 5, dryRun: true }) => {
  const res = await api.post('/agent/run', data);
  return res.data;
};

// --- Settings APIs ---
export const fetchSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (data) => {
  const res = await api.put('/settings', data);
  return res.data;
};

// --- User Management APIs (Admin Only) ---
export const fetchUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

export const createUser = async (data) => {
  const res = await api.post('/users', data);
  return res.data;
};

export const updateUserRole = async (id, role) => {
  const res = await api.patch(`/users/${id}/role`, { role });
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};

export default api;
