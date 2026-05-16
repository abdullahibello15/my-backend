const express = require("express");
const router = express.Router();
const pool = require("../database/postgres");

// Create a transaction
router.post("/", async (req, res) => {
  const { userId, type, amount, reference, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, reference, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, amount, reference, description],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all transactions for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update transaction status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
