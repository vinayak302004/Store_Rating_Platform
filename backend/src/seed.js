import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { initDb, pool } from "./db.js";

dotenv.config();

const users = [
  {
    name: "Roxiler System Administrator",
    email: "admin@roxiler.local",
    password: "Admin@123",
    address: "Pune, Maharashtra, India",
    role: "ADMIN"
  },
  {
    name: "Roxiler Demo Store Owner",
    email: "owner@roxiler.local",
    password: "Owner@123",
    address: "Pune, Maharashtra, India",
    role: "OWNER"
  }
];

await initDb();

for (const u of users) {
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [u.email]);

  if (!existing.length) {
    const hash = await bcrypt.hash(u.password, 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, ?)`,
      [u.name, u.email, hash, u.address, u.role]
    );
    console.log(`Created ${u.role}: ${u.email}`);
  }
}

const [owners] = await pool.query(
  "SELECT id FROM users WHERE email = ? AND role = 'OWNER'",
  ["owner@roxiler.local"]
);

if (owners.length) {
  const [stores] = await pool.query(
    "SELECT id FROM stores WHERE owner_id = ?",
    [owners[0].id]
  );

  if (!stores.length) {
    await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES (?, ?, ?, ?)`,
      [
        "Roxiler Demo Store",
        "store@roxiler.local",
        "Pune, Maharashtra, India",
        owners[0].id
      ]
    );
    console.log("Created demo store");
  }
}

await pool.end();
console.log("Seed complete");
