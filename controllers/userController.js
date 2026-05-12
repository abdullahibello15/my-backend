const bcrypt = require('bcryptjs');
const User = require('../models/User');

const formatUserForTable = (user) => ({
  _id: user._id,
  id: user._id,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  name: user.name,
  email: user.email,
  initialBalance: user.initialBalance || 0,
  accountType: user.accountType || 'Standard',
  accountStatus: user.accountStatus || 'Active',
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users.map(formatUserForTable));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(formatUserForTable(user));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createUser = async (req, res) => {
  const {
    firstName,
    lastName,
    name,
    email,
    emailAddress,
    password,
    initialBalance = 0,
    accountType = 'Standard',
    accountStatus = 'Active'
  } = req.body;

  const userEmail = emailAddress || email;
  const fullName = name || [firstName, lastName].filter(Boolean).join(' ');

  if ((!name && (!firstName || !lastName)) || !userEmail || !password) {
    return res.status(400).json({
      error: 'First name, last name, email address and password are required'
    });
  }

  try {
    const exists = await User.findOne({ email: userEmail });
    if (exists) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      name: fullName,
      email: userEmail,
      password: hashedPassword,
      initialBalance: Number(initialBalance) || 0,
      accountType,
      accountStatus
    });

    res.status(201).json({
      message: 'User created',
      user: formatUserForTable(user)
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getUsers, getUser, createUser, deleteUser };
