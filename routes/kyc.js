const express = require("express");
const router = express.Router();
const pool = require("../database/postgres");

// Submit KYC
router.post("/", async (req, res) => {
  const { userId, fullName, dateOfBirth, idType, idNumber } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO kyc (user_id, full_name, date_of_birth, id_type, id_number)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET full_name = $2, date_of_birth = $3, id_type = $4, id_number = $5, status = 'pending', submitted_at = NOW()
       RETURNING *`,
      [userId, fullName, dateOfBirth, idType, idNumber],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get KYC status for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM kyc WHERE user_id = $1`, [
      userId,
    ]);
    if (!result.rows.length)
      return res.status(404).json({ error: "KYC not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN — Approve or reject KYC
router.patch("/:userId/review", async (req, res) => {
  const { adminKey, status } = req.body;
  const { userId } = req.params;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      `UPDATE kyc SET status = $1, reviewed_at = NOW() WHERE user_id = $2 RETURNING *`,
      [status, userId],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
