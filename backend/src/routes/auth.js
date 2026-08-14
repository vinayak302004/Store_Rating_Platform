import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { validateUserInput } from "../middleware/validate.js";

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role
  };
}

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const error = validateUserInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const { name, email, address, password } = req.body;
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (existing.length) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, 'USER')`,
      [name.trim(), email.trim().toLowerCase(), hash, address.trim()]
    );

    const [rows] = await pool.query(
      "SELECT id, name, email, address, role FROM users WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({ user: rows[0], token: tokenFor(rows[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, address, role FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = publicUser(rows[0]);
    res.json({ user, token: tokenFor(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Login failed" });
  }
});

router.patch("/password", auth, async (req, res) => {
  try {
    const { password } = req.body;
    const error = validateUserInput({ password }, { passwordRequired: true });
    if (error) return res.status(400).json({ message: error });

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hash, req.user.id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Password update failed" });
  }
});

export default router;
