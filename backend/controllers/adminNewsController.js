import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create news with image upload
const createNews = async (req, res) => {
  let imagePath = null;

  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    // Parse form data
    const title = req.body.title;
    const caption = req.body.caption || "";
    const content = req.body.content;
    let tags = req.body.tags;

    console.log("Parsed data:", { title, caption, content, tags });

    const userId = 1; // In real app, get from auth token

    // Get uploaded file path
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
      console.log("Image path:", imagePath);
    }

    // Validation
    if (!title || !content) {
      // Delete uploaded file if validation fails
      if (req.file) {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          req.file.filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    // Parse tags from form data
    let tagIds = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagIds = tags.map((t) => parseInt(t)).filter((t) => !isNaN(t) && t > 0);
      } else if (typeof tags === "string") {
        // Handle single tag or comma-separated string
        const tagsStr = tags.trim();
        if (tagsStr) {
          tagIds = tagsStr
            .split(",")
            .map((t) => parseInt(t.trim()))
            .filter((t) => !isNaN(t) && t > 0);
        }
      }
    }

    console.log("Parsed tag IDs:", tagIds);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert news
      const [newsResult] = await connection.query(
        "INSERT INTO news (user_id, title, caption, content, image) VALUES (?, ?, ?, ?, ?)",
        [userId, title, caption, content, imagePath],
      );

      const newsId = newsResult.insertId;
      console.log("Created news ID:", newsId);

      // Add tags if provided
      if (tagIds.length > 0) {
        const tagValues = tagIds.map((tagId) => [newsId, tagId]);
        await connection.query(
          "INSERT INTO news_tags (news_id, tag_id) VALUES ?",
          [tagValues],
        );
        console.log("Tags inserted:", tagValues.length);
      }

      await connection.commit();

      // Get the created news with tags
      const [[createdNews]] = await connection.query(
        `
        SELECT 
          n.*,
          u.name as author,
          GROUP_CONCAT(DISTINCT t.name) as tags
        FROM news n
        JOIN users u ON u.id = n.user_id
        LEFT JOIN news_tags nt ON nt.news_id = n.id
        LEFT JOIN tags t ON t.id = nt.tag_id
        WHERE n.id = ?
        GROUP BY n.id
      `,
        [newsId],
      );

      res.status(201).json({
        ...createdNews,
        tags: createdNews.tags ? createdNews.tags.split(",") : [],
        message: "News created successfully",
      });
    } catch (err) {
      await connection.rollback();
      // Delete uploaded file on error
      if (req.file) {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          req.file.filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      console.error("Database error in transaction:", err);
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error creating news:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// Other functions remain the same...
const getAllNews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get news with tags
    const [news] = await pool.query(
      `
      SELECT 
        n.*,
        u.name as author,
        GROUP_CONCAT(DISTINCT t.name) as tags
      FROM news n
      JOIN users u ON u.id = n.user_id
      LEFT JOIN news_tags nt ON nt.news_id = n.id
      LEFT JOIN tags t ON t.id = nt.tag_id
      GROUP BY n.id
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [parseInt(limit), parseInt(offset)],
    );

    // Get total count for pagination
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM news",
    );

    // Parse tags from string to array
    const newsWithParsedTags = news.map((item) => ({
      ...item,
      tags: item.tags ? item.tags.split(",") : [],
    }));

    res.json({
      news: newsWithParsedTags,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[news]] = await pool.query(
      `
      SELECT 
        n.*,
        u.name as author
      FROM news n
      JOIN users u ON u.id = n.user_id
      WHERE n.id = ?
    `,
      [id],
    );

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    // Get tags for this news
    const [tags] = await pool.query(
      `
      SELECT t.id, t.name 
      FROM tags t
      JOIN news_tags nt ON nt.tag_id = t.id
      WHERE nt.news_id = ?
      ORDER BY t.name
    `,
      [id],
    );

    res.json({
      ...news,
      tags: tags.map((tag) => tag.id),
    });
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete from news_tags first
      await connection.query("DELETE FROM news_tags WHERE news_id = ?", [id]);

      // Delete from comments
      await connection.query("DELETE FROM comments WHERE news_id = ?", [id]);

      // Delete from likes
      await connection.query("DELETE FROM likes WHERE news_id = ?", [id]);

      // Delete news
      const [result] = await connection.query("DELETE FROM news WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "News not found" });
      }

      await connection.commit();
      res.json({ message: "News deleted successfully" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error deleting news:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  getAllNews,
  getNewsById,
  createNews,
  deleteNews,
};
