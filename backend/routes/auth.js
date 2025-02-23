const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../routes/User'); // Ensure the path is correct

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error in signup' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error in login' });
  }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header
  if (!token) return res.sendStatus(403); // Forbidden

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(401); // Unauthorized
    req.userId = decoded.userId; // Attach user ID to request
    next(); // Proceed to next middleware or route handler
  });
};

// Protected Route (Dashboard)
router.get('/dashboard', verifyToken, (req, res) => {
  res.json({ message: 'Welcome to the dashboard!', userId: req.userId });
});

module.exports = router;
