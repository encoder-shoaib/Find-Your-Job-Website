const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { getCollection, isDBConnected } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// All user management routes require admin
router.use(requireAdmin);

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.json({
        success: true,
        users: [
          {
            _id: 'admin_static_1',
            name: 'uFirst Administrator',
            email: 'admin@yourfindjob.com',
            username: 'admin',
            role: 'admin',
            organization: 'uFirst-LTD',
            status: 'Active',
            created_at: new Date().toISOString(),
          },
          {
            _id: 'user_static_2',
            name: 'Job Seeker Candidate',
            email: 'candidate@ufirst.com',
            username: 'candidate',
            role: 'user',
            organization: 'Candidate',
            status: 'Active',
            created_at: new Date().toISOString(),
          },
        ],
        count: 2,
        source: 'fallback',
      });
    }

    const usersCol = getCollection('users');
    const users = await usersCol
      .find({}, { projection: { password: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    res.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role = 'user', organization = 'uFirst-LTD' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password required.' });
    }

    const usersCol = getCollection('users');
    const existing = await usersCol.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const doc = {
      username: email.split('@')[0],
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: role.toLowerCase() === 'admin' ? 'admin' : 'user',
      organization: organization.trim(),
      status: 'Active',
      saved_jobs: [],
      created_at: new Date().toISOString(),
    };

    const result = await usersCol.insertOne(doc);
    const { password: _, ...userWithoutPass } = doc;

    res.json({
      success: true,
      message: 'User created successfully.',
      user: { ...userWithoutPass, _id: result.insertedId },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/users/:id/role - Toggle / Update user role
router.patch('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !['admin', 'user'].includes(role.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Valid role (admin or user) required.' });
    }

    const usersCol = getCollection('users');
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { email: id };

    const updated = await usersCol.findOneAndUpdate(
      filter,
      { $set: { role: role.toLowerCase(), updated_at: new Date().toISOString() } },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, message: `Role updated to ${role}`, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usersCol = getCollection('users');
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { email: id };

    // Prevent deleting the primary admin
    const target = await usersCol.findOne(filter);
    if (target && target.email === 'admin@yourfindjob.com') {
      return res.status(400).json({ success: false, error: 'Cannot delete primary root administrator account.' });
    }

    const result = await usersCol.deleteOne(filter);
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
