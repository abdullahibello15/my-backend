const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("myDatabase");
const balances = db.collection("balances");

// ADMIN — Add to balance
router.post("/admin/balance", async (req, res) => {
  const { adminKey, userId, amount } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await balances.updateOne(
    { userId },
    { $inc: { balance: amount } },
    { upsert: true },
  );

  const updated = await balances.findOne({ userId });
  res.json({ success: true, userId, newBalance: updated.balance });
});

// ADMIN — Set exact balance
router.put("/admin/balance", async (req, res) => {
  const { adminKey, userId, amount } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await balances.updateOne(
    { userId },
    { $set: { balance: amount } },
    { upsert: true },
  );

  res.json({ success: true, userId, balance: amount });
});

// PUBLIC — Get balance
router.get("/balance/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = await balances.findOne({ userId });

  if (!result) return res.status(404).json({ error: "User not found" });

  res.json({ userId, balance: result.balance });
});

module.exports = router;
