
import pool from "./db.js"; // replace with the actual file name

async function testConnection() {
  try {
    console.log({
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT,
    });

    // Get a connection from the pool
    const connection = await pool.getConnection();

    console.log("✅ Connected to the database!");

    // Run a simple query
    const [rows] = await connection.query("SHOW DATABASES;");
    console.log("Databases:");
    console.table(rows);
    console.log({
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT,
    });

    // Release the connection back to the pool
    connection.release();

    // End the pool (optional, if script ends here)
    await pool.end();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

testConnection();
