const express = require("express");
const router = express.Router();
const Balance = require("../models/Balance");

// ADMIN — Add to balance
router.post("/admin/balance", async (req, res) => {
  const { adminKey, userId, amount } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const updated = await Balance.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { upsert: true, new: true },
    );

    res.json({ success: true, userId, newBalance: updated.balance });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN — Set exact balance
router.put("/admin/balance", async (req, res) => {
  const { adminKey, userId, amount } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const updated = await Balance.findOneAndUpdate(
      { userId },
      { $set: { balance: amount } },
      { upsert: true, new: true },
    );

    res.json({ success: true, userId, balance: updated.balance });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUBLIC — Get balance
router.get("/balance/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await Balance.findOne({ userId });
    if (!result) return res.status(404).json({ error: "User not found" });

    res.json({ userId, balance: result.balance });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
