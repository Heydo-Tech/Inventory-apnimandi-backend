const express = require('express');
const router = express.Router();
const { login, create_user } = require('../Resolvers/userResolver');
const { authenticateToken } = require('../middleware/Authentication');

router.post("/login", async (req, res) => {
  const { name, password, establishmentId } = req.body;
  console.log('Login request:', { name, password, establishmentId });
  const result = await login(name, password, establishmentId);
  console.log('Login result:', result);
  if (result.success) {
    console.log(`Logged in: ${name}, Establishment: ${establishmentId || result.establishmentId}`);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    res.json({
      success: true,
      message: 'Login successful',
      username: result.username,
      role: result.role,
      establishmentId: result.establishmentId
    });
  } else {
    res.status(401).json(result);
  }
});

router.post("/create", authenticateToken('admin'), async (req, res) => {
  const { name, password, role, establishmentId } = req.body;
  const result = await create_user(name, password, role, establishmentId);
  if (result.success) {
    console.log(`Created user: ${name}, Establishment: ${establishmentId}`);
  }
  res.json(result);
});

router.get("/tokendata", authenticateToken(), async (req, res) => {
  try {
    res.json({
      username: req.user.username,
      role: req.user.role,
      establishmentId: req.user.establishmentId
    });
  } catch (error) {
    console.error('Token data error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

router.get("/", authenticateToken('admin'), async (req, res) => {
  try {
    const User = require('../Models/user');
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.delete("/delete/:name/:establishmentId", authenticateToken('admin'), async (req, res) => {
  try {
    const { name, establishmentId } = req.params;
    const User = require('../Models/user');
    await User.deleteOne({ name, establishmentId: Number(establishmentId) });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;