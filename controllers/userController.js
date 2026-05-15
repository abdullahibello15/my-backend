const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

// ✅ One place for error handling
const handleError = (err, res) => {
  console.error(err); // ✅ always log
  if (err.name === "CastError")
    return res.status(404).json({ error: "User not found" });
  if (err.name === "ValidationError")
    return res.status(400).json({ error: err.message });
  if (err.code === 11000)
    return res.status(400).json({ error: "Email already exists" });
  res.status(500).json({ error: "Server error" });
};

// ✅ One consistent shape the frontend can rely on
const formatUser = (user) => ({
  _id: user._id.toString(),
  id: user._id.toString(),
  name: user.name,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  email: user.email,
  balance: user.initialBalance || 0, // ✅ consistent field name
  initialBalance: user.initialBalance || 0,
  accountType: user.accountType || "Standard",
  status: user.accountStatus || "Active", // ✅ consistent field name
  accountStatus: user.accountStatus || "Active",
  role: user.role,
  createdAt: user.createdAt,
});

// ✅ ID validation helper
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users.map(formatUser));
  } catch (err) {
    handleError(err, res);
  }
};

const getUser = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: "User not found" });
  }
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(formatUser(user));
  } catch (err) {
    handleError(err, res);
  }
};

const createUser = async (req, res) => {
  const {
    firstName,
    lastName,
    name,
    email,
    password,
    initialBalance = 0,
    accountType = "Standard",
    accountStatus = "Active",
  } = req.body;

  const fullName = name || [firstName, lastName].filter(Boolean).join(" ");

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email and password are required" });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const user = await User.create({
      firstName,
      lastName,
      name: fullName,
      email,
      password: await bcrypt.hash(password, 10),
      initialBalance: Number(initialBalance) || 0,
      accountType,
      accountStatus,
    });

    res.status(201).json({ message: "User created", user: formatUser(user) });
  } catch (err) {
    handleError(err, res);
  }
};

const updateUser = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "name",
    "email",
    "initialBalance",
    "accountType",
    "accountStatus",
    "role",
  ];
  try {
    const updates = Object.fromEntries(
      allowedFields
        .filter((f) => req.body[f] !== undefined)
        .map((f) => [f, req.body[f]]),
    );

    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    if (updates.initialBalance !== undefined) {
      updates.initialBalance = Number(updates.initialBalance) || 0;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated", user: formatUser(user) });
  } catch (err) {
    handleError(err, res);
  }
};

const deleteUser = async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: "User not found" });
  }
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    handleError(err, res);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
