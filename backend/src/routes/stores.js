import express from "express";
import { pool } from "../db.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { validateRating } from "../middleware/validate.js";

const router = express.Router();

router.use(auth, allowRoles("USER"));

router.get("/", async (req, res) => {
  const { name = "", address = "", sortBy = "name", order = "asc" } = req.query;

  const allowedSort = {
    name: "s.name",
    address: "s.address",
    rating: "average_rating",
    myRating: "my_rating"
  };

  const sortColumn = allowedSort[sortBy] || "s.name";
  const direction = order === "desc" ? "DESC" : "ASC";

  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.address,
            ROUND(COALESCE(AVG(allr.rating), 0), 2) AS overall_rating,
            MAX(myr.rating) AS my_rating
     FROM stores s
     LEFT JOIN ratings allr ON allr.store_id = s.id
     LEFT JOIN ratings myr
       ON myr.store_id = s.id AND myr.user_id = ?
     WHERE s.name LIKE ? AND s.address LIKE ?
     GROUP BY s.id
     ORDER BY ${sortColumn} ${direction}`,
    [req.user.id, `%${name}%`, `%${address}%`]
  );

  res.json(rows);
});

router.post("/:storeId/rating", async (req, res) => {
  const rating = validateRating(req.body.rating);
  if (!rating) return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });

  const [stores] = await pool.query("SELECT id FROM stores WHERE id = ?", [
    req.params.storeId
  ]);
  if (!stores.length) return res.status(404).json({ message: "Store not found" });

  try {
    await pool.query(
      "INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)",
      [req.user.id, req.params.storeId, rating]
    );

    res.status(201).json({ message: "Rating submitted" });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "You have already rated this store. Use modify instead." });
    }
    console.error(e);
    res.status(500).json({ message: "Could not submit rating" });
  }
});

router.put("/:storeId/rating", async (req, res) => {
  const rating = validateRating(req.body.rating);
  if (!rating) return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });

  const [result] = await pool.query(
    "UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?",
    [rating, req.user.id, req.params.storeId]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "You have not rated this store yet" });
  }

  res.json({ message: "Rating updated" });
});

export default router;
