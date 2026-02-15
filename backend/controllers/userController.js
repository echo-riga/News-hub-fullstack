import pool from "../db.js";

const getUserByName = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: "Name is required" });

    // Check if user exists
    let [rows] = await pool.query("SELECT id, name FROM users WHERE name = ?", [
      name,
    ]);

    if (rows.length > 0) {
      // User exists → return immediately
      return res.json(rows[0]);
    }

    // Otherwise, create user
    const [result] = await pool.query("INSERT INTO users (name) VALUES (?)", [
      name,
    ]);

    // Return newly created user
    res.json({ id: result.insertId, name });
  } catch (err) {
    console.error(err);

    // Handle unique race condition
    if (err.code === "ER_DUP_ENTRY") {
      const [rows] = await pool.query(
        "SELECT id, name FROM users WHERE name = ?",
        [req.body.name],
      );
      return res.json(rows[0]);
    }

    res.status(500).json({ message: "Server error" });
  }
};

export default { getUserByName };
