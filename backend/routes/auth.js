const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123';

// Register User (For Admin to create initial users or self-register if publicly allowed)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            role
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Create Token
        const payload = {
            id: user.id,
            role: user.role
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const Candidate = require('../models/Candidate');

        // 1. Check if user exists in User collection (Admin, HR, Interviewer)
        let user = await User.findOne({ email });

        if (user) {
            // Validate password for User
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Create Token for User
            const payload = {
                id: user.id,
                role: user.role
            };

            jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '24h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
                }
            );

        } else {
            // 2. If not in User, check Candidate collection
            const candidate = await Candidate.findOne({ email });

            if (candidate) {
                // For candidates, we (currently) only check email existence.
                // In a real app, you'd likely have a password or OTP.
                // Treating as "candidate" role.

                const payload = {
                    id: candidate.id,
                    role: 'candidate'
                };

                jwt.sign(
                    payload,
                    JWT_SECRET,
                    { expiresIn: '24h' },
                    (err, token) => {
                        if (err) throw err;
                        // Return candidate info structured like user
                        res.json({
                            token,
                            user: {
                                id: candidate.id,
                                name: candidate.name,
                                email: candidate.email,
                                role: 'candidate'
                            }
                        });
                    }
                );
            } else {
                // Not found in either
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }
        }

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get User (Projected Route Example)
router.get('/user', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
