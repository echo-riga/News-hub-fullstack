// backend/controllers/newsController.js - ADD THIS METHOD
import pool from "../db.js";

// Get news with optional tag filtering
const getNews = async (req, res) => {
  try {
    const { last_seen_id, tag } = req.query;

    console.log("🔍 Backend called:", { last_seen_id, tag });

    let query = `
      SELECT 
        n.id, n.title, n.caption, n.content, n.image, n.created_at,
        u.name as author,
        (SELECT COUNT(*) FROM likes l WHERE l.news_id = n.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.news_id = n.id) as comments_count
      FROM news n
      JOIN users u ON u.id = n.user_id
    `;

    const params = [];

    // Add conditions based on parameters
    const conditions = [];

    if (last_seen_id) {
      conditions.push("n.id < ?");
      params.push(parseInt(last_seen_id));
    }

    if (tag) {
      // Join with tags table to filter by tag name
      query += `
        JOIN news_tags nt ON nt.news_id = n.id
        JOIN tags t ON t.id = nt.tag_id
      `;
      conditions.push("t.name = ?");
      params.push(tag);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY n.id DESC LIMIT 3";

    console.log("📝 SQL Query:", query);
    console.log("📝 SQL Params:", params);

    const [rows] = await pool.query(query, params);

    // Get tags for each news item
    const newsWithTags = await Promise.all(
      rows.map(async (item) => {
        const [tags] = await pool.query(
          `SELECT t.name 
           FROM tags t
           JOIN news_tags nt ON nt.tag_id = t.id
           WHERE nt.news_id = ?
           ORDER BY t.name`,
          [item.id],
        );

        return {
          ...item,
          tags: tags.map((tag) => tag.name),
        };
      }),
    );

    console.log(`✅ Found ${newsWithTags.length} news items`);

    res.json(newsWithTags);
  } catch (err) {
    console.error("❌ Database error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// Get single news by ID
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Fetching news by ID:", id);

    const [news] = await pool.query(
      `SELECT 
        n.id,
        n.title,
        n.caption,
        n.content,
        n.image,
        n.created_at,
        u.name as author,
        (SELECT COUNT(*) FROM likes l WHERE l.news_id = n.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.news_id = n.id) as comments_count
      FROM news n
      JOIN users u ON u.id = n.user_id
      WHERE n.id = ?`,
      [id],
    );

    if (news.length === 0) {
      console.log("❌ News not found:", id);
      return res.status(404).json({ error: "News not found" });
    }

    // Get tags for this news item
    const [tags] = await pool.query(
      `SELECT t.name 
       FROM tags t
       JOIN news_tags nt ON nt.tag_id = t.id
       WHERE nt.news_id = ?
       ORDER BY t.name`,
      [id],
    );

    const newsItem = {
      ...news[0],
      tags: tags.map((tag) => tag.name),
    };

    console.log("✅ News found:", newsItem.title);

    res.json(newsItem);
  } catch (error) {
    console.error("❌ Error fetching news by ID:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};

// Get ALL news (no pagination) - for tag counts
const getAllNews = async (req, res) => {
  try {
    console.log("🔍 Fetching all news for tags");

    const [rows] = await pool.query(
      `SELECT 
        n.id, n.title, n.caption, n.content, n.image, n.created_at,
        u.name as author,
        (SELECT COUNT(*) FROM likes l WHERE l.news_id = n.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.news_id = n.id) as comments_count
      FROM news n
      JOIN users u ON u.id = n.user_id
      ORDER BY n.id DESC`,
    );

    // Get tags for each news item
    const newsWithTags = await Promise.all(
      rows.map(async (item) => {
        const [tags] = await pool.query(
          `SELECT t.name 
           FROM tags t
           JOIN news_tags nt ON nt.tag_id = t.id
           WHERE nt.news_id = ?
           ORDER BY t.name`,
          [item.id],
        );

        return {
          ...item,
          tags: tags.map((tag) => tag.name),
        };
      }),
    );

    console.log(`✅ Found ${newsWithTags.length} total news items`);

    res.json(newsWithTags);
  } catch (err) {
    console.error("❌ Database error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

export default { getNews, getNewsById, getAllNews };
