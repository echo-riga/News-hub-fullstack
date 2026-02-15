import pool from "../db.js";

// Get all tags
const getTags = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tags ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new tag
const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    // Check if tag already exists
    const [existing] = await pool.query("SELECT id FROM tags WHERE name = ?", [
      name,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Tag already exists" });
    }

    const [result] = await pool.query("INSERT INTO tags (name) VALUES (?)", [
      name,
    ]);
    res.status(201).json({
      id: result.insertId,
      name,
      message: "Tag created successfully",
    });
  } catch (err) {
    console.error("Error creating tag:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a tag
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tag is used in any news
    const [used] = await pool.query(
      "SELECT COUNT(*) as count FROM news_tags WHERE tag_id = ?",
      [id],
    );

    if (used[0].count > 0) {
      return res.status(400).json({
        message:
          "Cannot delete tag that is in use. Remove it from all news first.",
      });
    }

    await pool.query("DELETE FROM tags WHERE id = ?", [id]);
    res.json({ message: "Tag deleted successfully" });
  } catch (err) {
    console.error("Error deleting tag:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export default { getTags, createTag, deleteTag };
