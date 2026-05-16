const express = require("express");
const router = express.Router();
const pool = require("../database/postgres");

// Create a payment
router.post("/", async (req, res) => {
  const { userId, amount, currency, provider, providerRef } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO payments (user_id, amount, currency, provider, provider_ref)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, amount, currency || "USD", provider, providerRef],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all payments for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update payment status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { adminKey, status } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      `UPDATE payments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
