import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      address VARCHAR(400) NOT NULL,
      role ENUM('ADMIN','USER','OWNER') NOT NULL DEFAULT 'USER',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_users_name (name),
      INDEX idx_users_email (email),
      INDEX idx_users_role (role)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      address VARCHAR(400) NOT NULL,
      owner_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_store_owner
        FOREIGN KEY (owner_id) REFERENCES users(id)
        ON DELETE SET NULL,
      INDEX idx_stores_name (name),
      INDEX idx_stores_address (address)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      store_id INT NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
      CONSTRAINT fk_rating_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_rating_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      CONSTRAINT uq_user_store UNIQUE (user_id, store_id),
      INDEX idx_ratings_store (store_id),
      INDEX idx_ratings_user (user_id)
    )
  `);
}
