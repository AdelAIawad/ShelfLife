const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // New users: onboardingComplete defaults to false → they hit the wizard
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: user.toPublic() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: user.toPublic() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// PUT /api/auth/onboarding — save preferences from the wizard
router.put('/onboarding', auth, async (req, res) => {
  try {
    const { genres, yearlyGoal, motivation } = req.body;

    // Validation
    if (!Array.isArray(genres) || genres.length < 1) {
      return res.status(400).json({ message: 'Pick at least one genre you enjoy' });
    }
    if (genres.length > 10) {
      return res.status(400).json({ message: 'Too many genres selected' });
    }
    const goal = Number(yearlyGoal);
    if (!Number.isInteger(goal) || goal < 1 || goal > 365) {
      return res.status(400).json({ message: 'Yearly goal must be between 1 and 365' });
    }
    const allowedMotivations = ['escape', 'learn', 'understand', 'grow', ''];
    if (motivation && !allowedMotivations.includes(motivation)) {
      return res.status(400).json({ message: 'Invalid motivation value' });
    }

    req.user.genres = genres.map(g => String(g).trim()).filter(Boolean).slice(0, 10);
    req.user.yearlyGoal = goal;
    req.user.motivation = motivation || '';
    req.user.onboardingComplete = true;
    await req.user.save();

    res.json({ user: req.user.toPublic() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
