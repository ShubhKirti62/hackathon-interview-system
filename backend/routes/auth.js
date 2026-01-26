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

        // If registering as candidate, check if email exists in candidates collection
        if (role === 'candidate') {
            const Candidate = require('../models/Candidate');
            const existingCandidate = await Candidate.findOne({ email });
            if (!existingCandidate) {
                return res.status(403).json({ 
                    msg: 'Email not found in candidate database. Please contact HR to upload your resume first.' 
                });
            }
        }

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

        // 1. Check if user exists in User collection (Admin, Candidate)
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
                // Check for static password
                if (password !== '123456') {
                     return res.status(400).json({ msg: 'Invalid Credentials' });
                }

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
        let userData = await User.findById(req.user.id).select('-password');

        if (!userData) {
            const Candidate = require('../models/Candidate');
            userData = await Candidate.findById(req.user.id);
            if (userData) {
                // Add virtual role for frontend compatibility
                userData = userData.toObject();
                userData.role = 'candidate';
            }
        }

        if (!userData) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// List Users by Role (Admin only)
router.get('/users', require('../middleware/auth'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const { role } = req.query;
        let query = {};
        if (role) query.role = role;

        const usersData = await User.find(query).select('-password').lean();
        const usersArray = Array.isArray(usersData) ? usersData : (usersData ? [usersData] : []);
        res.json(usersArray);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Remove User Access (Delete User)
router.delete('/users/:id', require('../middleware/auth'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const userToRemove = await User.findById(req.params.id);
        if (!userToRemove) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (userToRemove.role === 'admin') {
            return res.status(400).json({ msg: 'Cannot delete an admin' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User access removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
