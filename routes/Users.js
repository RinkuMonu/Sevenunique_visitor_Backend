const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/Users");
const auth = require("../midleware/authMiddleware");

const router = express.Router();

/* ================= ROLE CHECK ================= */
const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/* =================================================
   🔐 LOGIN (ALL ROLES)
   POST /api/auth/login
================================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.isActive)
      return res.status(403).json({ message: "User deactivated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



router.post("/register-admin", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ role: "ADMIN" });
    if (existing)
      return res.status(400).json({ message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      phone,
    });

    res.json({ message: "First admin created", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


/* =================================================
   ➕ CREATE USER (ADMIN ONLY)
   POST /api/auth/users
================================================= */
router.post("/users", auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   📋 GET ALL USERS (ADMIN)
================================================= */
router.get("/users", auth, isAdmin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

/* =================================================
   👤 GET SINGLE USER
================================================= */
router.get("/users/:id", auth, isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

/* =================================================
   ✏️ UPDATE USER (NAME / EMAIL / ROLE / PHONE)
================================================= */
router.put("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const { name, email, role, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, phone },
      { new: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   🔁 ACTIVATE / DEACTIVATE USER
================================================= */
router.put("/users/:id/status", auth, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"}`,
      user,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   🔑 RESET PASSWORD
================================================= */
router.put("/users/:id/password", auth, isAdmin, async (req, res) => {
  try {
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(req.params.id, {
      password: hashedPassword,
    });

    res.json({ message: "Password updated successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   ❌ DELETE USER
================================================= */
router.delete("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =================================================
   👥 GET EMPLOYEES LIST (FOR DROPDOWN)
================================================= */

// router.get("/employees", auth, async (req, res) => {
router.get("/employees", async (req, res) => {
  const employees = await User.find({
    role: "EMPLOYEE",
    isActive: true,
  }).select("name email phone");

  res.json(employees);
});


module.exports = router;
