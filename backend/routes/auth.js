const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getCollection, isDBConnected } = require('../config/db');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

// Seed default accounts in MongoDB
async function seedDefaultAccounts() {
  try {
    const usersCol = getCollection('users');

    // 1. Seed Admin
    const adminExists = await usersCol.findOne({ role: { $in: ['admin', 'Super Admin'] } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@2026#Jobs', 10);
      await usersCol.insertOne({
        username: 'admin',
        email: 'admin@yourfindjob.com',
        password: hashedPassword,
        plain_hint: 'Admin@2026#Jobs',
        name: 'uFirst Administrator',
        role: 'admin',
        organization: 'uFirst-LTD',
        status: 'Active',
        permissions: ['all'],
        created_at: new Date().toISOString(),
      });
      console.log('[Auth] Seeded Admin: admin@yourfindjob.com / Admin@2026#Jobs');
    }

    // 2. Seed Regular User / Candidate
    const userExists = await usersCol.findOne({ email: 'candidate@ufirst.com' });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash('User@2026#Jobs', 10);
      await usersCol.insertOne({
        username: 'candidate',
        email: 'candidate@ufirst.com',
        password: hashedPassword,
        plain_hint: 'User@2026#Jobs',
        name: 'Job Seeker Candidate',
        role: 'user',
        organization: 'uFirst-LTD',
        status: 'Active',
        saved_jobs: [],
        created_at: new Date().toISOString(),
      });
      console.log('[Auth] Seeded User: candidate@ufirst.com / User@2026#Jobs');
    }
  } catch (err) {
    console.warn('[Auth] Seed warning:', err.message);
  }
}

setTimeout(seedDefaultAccounts, 800);

// POST /api/auth/register - Register new account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
    }

    const usersCol = getCollection('users');
    const existing = await usersCol.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username: email.split('@')[0],
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: 'user', // Defaults to regular user
      organization: 'Candidate',
      status: 'Active',
      saved_jobs: [],
      created_at: new Date().toISOString(),
    };

    const result = await usersCol.insertOne(newUser);
    const token = jwt.sign(
      {
        id: result.insertedId.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login - Login user or admin
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Username/email and password required.' });
    }

    const query = usernameOrEmail.trim().toLowerCase();

    // Zero-Fail Fallback for default accounts when MongoDB is offline / initializing
    if (!isDBConnected()) {
      if ((query === 'admin' || query === 'admin@yourfindjob.com' || query === 'admin@yourfiendjob.com') && password === 'Admin@2026#Jobs') {
        const token = jwt.sign(
          { id: 'admin_static_id', email: 'admin@yourfindjob.com', name: 'uFirst Administrator', role: 'admin' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({
          success: true,
          token,
          user: {
            id: 'admin_static_id',
            name: 'uFirst Administrator',
            email: 'admin@yourfindjob.com',
            role: 'admin',
            organization: 'uFirst-LTD',
          },
        });
      }
      if ((query === 'candidate' || query === 'candidate@ufirst.com') && password === 'User@2026#Jobs') {
        const token = jwt.sign(
          { id: 'user_static_id', email: 'candidate@ufirst.com', name: 'Job Seeker Candidate', role: 'user' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({
          success: true,
          token,
          user: {
            id: 'user_static_id',
            name: 'Job Seeker Candidate',
            email: 'candidate@ufirst.com',
            role: 'user',
            organization: 'uFirst-LTD Candidate',
          },
        });
      }
    }

    const usersCol = getCollection('users');

    const user = await usersCol.findOne({
      $or: [
        { email: query },
        { username: query },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User account not found.' });
    }

    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password; // Plain fallback if legacy
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
    }

    const roleNormalized = (user.role || 'user').toLowerCase() === 'super admin' ? 'admin' : (user.role || 'user');
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: roleNormalized,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: roleNormalized,
        organization: user.organization || 'uFirst-LTD',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me - Verify session
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.json({
        success: true,
        user: {
          id: req.user.id || 'static_id',
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          organization: 'uFirst-LTD',
          saved_jobs: [],
        },
      });
    }

    const usersCol = getCollection('users');
    const user = await usersCol.findOne({ email: req.user.email });
    if (!user) {
      return res.json({
        success: true,
        user: {
          id: req.user.id || 'static_id',
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          organization: 'uFirst-LTD',
          saved_jobs: [],
        },
      });
    }

    const roleNormalized = (user.role || 'user').toLowerCase() === 'super admin' ? 'admin' : (user.role || 'user');
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: roleNormalized,
        organization: user.organization,
        saved_jobs: user.saved_jobs || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/demo-credentials
router.get('/demo-credentials', (req, res) => {
  res.json({
    success: true,
    accounts: {
      admin: {
        email: 'admin@yourfindjob.com',
        username: 'admin',
        password: 'Admin@2026#Jobs',
        role: 'admin',
        name: 'uFirst Administrator',
        organization: 'uFirst-LTD',
        description: 'Complete administrative access: AI Agent Controls, Manage Jobs, Users, Settings',
      },
      user: {
        email: 'candidate@ufirst.com',
        username: 'candidate',
        password: 'User@2026#Jobs',
        role: 'user',
        name: 'Job Seeker Candidate',
        organization: 'uFirst-LTD Candidate',
        description: 'Candidate access: Browse tech jobs, filter, view AI fit breakdown, bookmark & apply',
      },
    },
  });
});

module.exports = router;
