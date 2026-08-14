import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import storeRoutes from "./routes/stores.js";
import ownerRoutes from "./routes/owner.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "roxiler-rating-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/owner", ownerRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const port = Number(process.env.PORT || 5000);

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
