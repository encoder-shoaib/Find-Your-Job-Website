const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { getCollection } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const { CONFIG_YAML_PATH } = require('../config/paths');

// GET /api/settings - Read settings from config.yaml and MongoDB
router.get('/', async (req, res) => {
  try {
    let configData = {};
    if (fs.existsSync(CONFIG_YAML_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_YAML_PATH, 'utf-8');
      configData = YAML.parse(fileContent) || {};
    }

    res.json({
      success: true,
      settings: {
        userProfile: configData.user_profile || {},
        techCategories: configData.tech_categories || {},
        scheduler: configData.scheduler || {},
        emailNotification: configData.email_notification || {},
        agent: configData.agent || {},
      },
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings - Update settings in config.yaml and MongoDB (Admin only)
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { userProfile, techCategories, scheduler, emailNotification } = req.body;

    let currentConfig = {};
    if (fs.existsSync(CONFIG_YAML_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_YAML_PATH, 'utf-8');
      currentConfig = YAML.parse(fileContent) || {};
    }

    if (userProfile) currentConfig.user_profile = { ...currentConfig.user_profile, ...userProfile };
    if (techCategories) currentConfig.tech_categories = techCategories;
    if (scheduler) currentConfig.scheduler = { ...currentConfig.scheduler, ...scheduler };
    if (emailNotification) currentConfig.email_notification = { ...currentConfig.email_notification, ...emailNotification };

    // Write back to config.yaml
    const newYaml = YAML.stringify(currentConfig);
    fs.writeFileSync(CONFIG_YAML_PATH, newYaml, 'utf-8');

    // Also persist in MongoDB settings collection
    try {
      const settingsCol = getCollection('settings');
      await settingsCol.updateOne(
        { key: 'global_settings' },
        { $set: { key: 'global_settings', config: currentConfig, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Could not mirror settings to MongoDB:', e.message);
    }

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      settings: {
        userProfile: currentConfig.user_profile,
        techCategories: currentConfig.tech_categories,
        scheduler: currentConfig.scheduler,
        emailNotification: currentConfig.email_notification,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

