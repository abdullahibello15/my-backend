const db = require('../database');

const getUsers = (req, res) => {
  const users = db.prepare('SELECT id, name, email, created_at FROM users').all();
  res.json(users);
};

const getUser = (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

const createUser = (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  try {
    const insert = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = insert.run(name, email, password);
    res.status(201).json({ message: 'User created', userId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
};

const deleteUser = (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
};

module.exports = { getUsers, getUser, createUser, deleteUser };
