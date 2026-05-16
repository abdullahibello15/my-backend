const express = require("express");
const router = express.Router();
const pool = require("../database/postgres");

// Create an audit log
router.post("/", async (req, res) => {
  const { userId, action, details, ipAddress } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, action, JSON.stringify(details), ipAddress],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all logs for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN — Get all logs
router.get("/", async (req, res) => {
  const { adminKey } = req.query;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
