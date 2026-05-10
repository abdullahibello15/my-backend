const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const insert = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = insert.run(name, email, hashedPassword, 'user');
    res.status(201).json({ message: '✅ Account created successfully', userId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });
  try {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ message: '✅ Admin login successful', role: 'admin', token });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });
    const token = generateToken(user);
    res.json({ message: '✅ Login successful', role: user.role, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup, login };
