const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper for single query execution similar to how we used sqlite
// In pg we usually execute queries directly from the pool.
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database schema
const initDb = async () => {
  try {
    // Organizations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        org_id VARCHAR(255) REFERENCES organizations(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) CHECK (role IN ('employee', 'manager', 'admin')),
        department VARCHAR(255),
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Devices
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        mac_address VARCHAR(255) UNIQUE NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        os_info TEXT,
        agent_version VARCHAR(50),
        last_ping TIMESTAMP
      )
    `);

    // Activity Logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) REFERENCES devices(id),
        user_id VARCHAR(255) REFERENCES users(id),
        app_name VARCHAR(255) NOT NULL,
        window_title TEXT,
        process_path TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_seconds INTEGER,
        productivity_category VARCHAR(50) DEFAULT 'neutral'
      )
    `);

    // Idle Logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS idle_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) REFERENCES devices(id),
        user_id VARCHAR(255) REFERENCES users(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_seconds INTEGER
      )
    `);

    // Screenshots
    await pool.query(`
      CREATE TABLE IF NOT EXISTS screenshots (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) REFERENCES devices(id),
        user_id VARCHAR(255) REFERENCES users(id),
        image_url TEXT NOT NULL,
        blur_level INTEGER DEFAULT 0,
        captured_at TIMESTAMP NOT NULL
      )
    `);

    console.log("PostgreSQL Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing PostgreSQL schema:", err);
  }
};

initDb();

module.exports = pool;
