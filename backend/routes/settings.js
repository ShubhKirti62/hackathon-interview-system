const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');

// Get all settings
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.find();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update or Create a setting
router.post('/', auth, async (req, res) => {
    try {
        const { key, value, description } = req.body;

        // Allow admins to change settings
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, description },
            { new: true, upsert: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Seed default time limits if they don't exist
const seedDefaults = async () => {
    const defaults = [
        { key: 'time_limit_easy', value: 60, description: 'Seconds allowed for Easy questions' },
        { key: 'time_limit_medium', value: 120, description: 'Seconds allowed for Medium questions' },
        { key: 'time_limit_hard', value: 180, description: 'Seconds allowed for Hard questions' }
    ];

    for (const d of defaults) {
        await Setting.findOneAndUpdate({ key: d.key }, d, { upsert: true });
    }
};

router.post('/seed', auth, async (req, res) => {
    try {
        await seedDefaults();
        res.json({ msg: 'Default settings seeded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
