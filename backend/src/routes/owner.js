import express from "express";
import { pool } from "../db.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(auth, allowRoles("OWNER"));

router.get("/dashboard", async (req, res) => {
  const [stores] = await pool.query(
    "SELECT id, name, email, address FROM stores WHERE owner_id = ?",
    [req.user.id]
  );

  if (!stores.length) {
    return res.json({ stores: [], averageRating: 0, raters: [] });
  }

  const storeIds = stores.map(s => s.id);
  const placeholders = storeIds.map(() => "?").join(",");

  const [[summary]] = await pool.query(
    `SELECT ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating,
            COUNT(r.id) AS ratingCount
     FROM ratings r
     WHERE r.store_id IN (${placeholders})`,
    storeIds
  );

  const [raters] = await pool.query(
    `SELECT u.id, u.name, u.email, u.address,
            s.name AS store_name, r.rating, r.updated_at
     FROM ratings r
     JOIN users u ON u.id = r.user_id
     JOIN stores s ON s.id = r.store_id
     WHERE s.owner_id = ?
     ORDER BY r.updated_at DESC`,
    [req.user.id]
  );

  res.json({
    stores,
    averageRating: Number(summary.averageRating || 0),
    ratingCount: Number(summary.ratingCount || 0),
    raters
  });
});

export default router;
