import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { validateUserInput } from "../middleware/validate.js";

const router = express.Router();

router.use(auth, allowRoles("ADMIN"));

router.get("/stats", async (req, res) => {
  const [[users]] = await pool.query("SELECT COUNT(*) AS count FROM users");
  const [[stores]] = await pool.query("SELECT COUNT(*) AS count FROM stores");
  const [[ratings]] = await pool.query("SELECT COUNT(*) AS count FROM ratings");

  res.json({
    users: Number(users.count),
    stores: Number(stores.count),
    ratings: Number(ratings.count)
  });
});

router.get("/stores", async (req, res) => {
  const {
    name = "",
    email = "",
    address = "",
    sortBy = "name",
    order = "asc"
  } = req.query;

  const allowedSort = {
    name: "s.name",
    email: "s.email",
    address: "s.address",
    rating: "average_rating"
  };

  const sortColumn = allowedSort[sortBy] || "s.name";
  const direction = order === "desc" ? "DESC" : "ASC";

  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.email, s.address,
            ROUND(COALESCE(AVG(r.rating), 0), 2) AS rating
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE s.name LIKE ? AND s.email LIKE ? AND s.address LIKE ?
     GROUP BY s.id
     ORDER BY ${sortColumn} ${direction}`,
    [`%${name}%`, `%${email}%`, `%${address}%`]
  );

  res.json(rows);
});

router.post("/stores", async (req, res) => {
  try {
    const { name, email, address, ownerId = null } = req.body;

    if (!name || !email || !address) {
      return res.status(400).json({ message: "Name, email and address are required" });
    }

    if (name.trim().length < 1 || name.trim().length > 255) {
      return res.status(400).json({ message: "Store name must be 1-255 characters" });
    }

    if (address.trim().length > 400) {
      return res.status(400).json({ message: "Address must be at most 400 characters" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid store email" });
    }

    if (ownerId) {
      const [owner] = await pool.query(
        "SELECT id FROM users WHERE id = ? AND role = 'OWNER'",
        [ownerId]
      );
      if (!owner.length) {
        return res.status(400).json({ message: "ownerId must belong to a Store Owner" });
      }
    }

    const [result] = await pool.query(
      "INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), address.trim(), ownerId || null]
    );

    res.status(201).json({ id: result.insertId, message: "Store created" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Could not create store" });
  }
});

router.get("/users", async (req, res) => {
  const {
    name = "",
    email = "",
    address = "",
    role = "",
    sortBy = "name",
    order = "asc"
  } = req.query;

  const allowedSort = {
    name: "u.name",
    email: "u.email",
    address: "u.address",
    role: "u.role"
  };

  const sortColumn = allowedSort[sortBy] || "u.name";
  const direction = order === "desc" ? "DESC" : "ASC";

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.address, u.role
     FROM users u
     WHERE u.name LIKE ?
       AND u.email LIKE ?
       AND u.address LIKE ?
       AND (? = '' OR u.role = ?)
     ORDER BY ${sortColumn} ${direction}`,
    [`%${name}%`, `%${email}%`, `%${address}%`, role, role]
  );

  res.json(rows);
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    if (!["ADMIN", "USER", "OWNER"].includes(role)) {
      return res.status(400).json({ message: "Role must be ADMIN, USER or OWNER" });
    }

    const error = validateUserInput({ name, email, password, address });
    if (error) return res.status(400).json({ message: error });

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email.trim().toLowerCase()
    ]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), hash, address.trim(), role]
    );

    res.status(201).json({ id: result.insertId, message: "User created" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Could not create user" });
  }
});

router.get("/users/:id", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.address, u.role,
            CASE
              WHEN u.role = 'OWNER' THEN ROUND(COALESCE(AVG(r.rating), 0), 2)
              ELSE NULL
            END AS rating
     FROM users u
     LEFT JOIN stores s ON s.owner_id = u.id
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE u.id = ?
     GROUP BY u.id`,
    [req.params.id]
  );

  if (!rows.length) return res.status(404).json({ message: "User not found" });
  res.json(rows[0]);
});

export default router;
