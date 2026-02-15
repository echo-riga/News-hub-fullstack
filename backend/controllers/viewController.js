// backend/controllers/viewController.js - FIXED
import pool from "../db.js";

// Track a view
const trackView = async (req, res) => {
  try {
    const { newsId, userId } = req.body;

    if (!newsId || !userId) {
      return res.status(400).json({ error: "newsId and userId are required" });
    }

    // Check if user already viewed this news in the last 24 hours
    const [recentView] = await pool.query(
      `SELECT id FROM views 
       WHERE news_id = ? AND user_id = ? 
       AND viewed_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [newsId, userId],
    );

    if (recentView.length > 0) {
      // Already viewed recently, don't track again
      return res.json({ message: "View already tracked", counted: false });
    }

    // Track the view
    await pool.query("INSERT INTO views (news_id, user_id) VALUES (?, ?)", [
      newsId,
      userId,
    ]);

    console.log(`👁️ View tracked: News ${newsId}, User ${userId}`);
    res.json({ message: "View tracked successfully", counted: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({ error: "Failed to track view" });
  }
};

// Get statistics
const getStatistics = async (req, res) => {
  try {
    // Get all news with their statistics
    const [newsStats] = await pool.query(
      `SELECT 
        n.id,
        n.title,
        n.image,
        n.created_at,
        u.name as author,
        (SELECT COUNT(*) FROM views v WHERE v.news_id = n.id) as views_count,
        (SELECT COUNT(*) FROM likes l WHERE l.news_id = n.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.news_id = n.id) as comments_count,
        (SELECT COUNT(DISTINCT v.user_id) FROM views v WHERE v.news_id = n.id) as unique_viewers
      FROM news n
      JOIN users u ON u.id = n.user_id
      ORDER BY views_count DESC`,
    );

    // Get total statistics
    const [totals] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM news) as total_news,
        (SELECT COUNT(*) FROM views) as total_views,
        (SELECT COUNT(*) FROM likes) as total_likes,
        (SELECT COUNT(*) FROM comments) as total_comments,
        (SELECT COUNT(*) FROM users) as total_users`,
    );

    // Get most active users - FIXED QUERY
    const [activeUsers] = await pool.query(
      `SELECT 
        u.name,
        COUNT(DISTINCT v.id) as views,
        COUNT(DISTINCT CONCAT(l.news_id, '-', l.user_id)) as likes,
        COUNT(DISTINCT c.id) as comments,
        (COUNT(DISTINCT v.id) + COUNT(DISTINCT CONCAT(l.news_id, '-', l.user_id)) + COUNT(DISTINCT c.id)) as total_activity
      FROM users u
      LEFT JOIN views v ON v.user_id = u.id
      LEFT JOIN likes l ON l.user_id = u.id
      LEFT JOIN comments c ON c.user_id = u.id
      GROUP BY u.id, u.name
      HAVING total_activity > 0
      ORDER BY total_activity DESC
      LIMIT 10`,
    );

    // Get recent activity
    const [recentActivity] = await pool.query(
      `(SELECT 
        'view' as type,
        n.title as news_title,
        u.name as user_name,
        v.viewed_at as activity_time
      FROM views v
      JOIN news n ON n.id = v.news_id
      JOIN users u ON u.id = v.user_id
      ORDER BY v.viewed_at DESC
      LIMIT 20)
      UNION ALL
      (SELECT 
        'comment' as type,
        n.title as news_title,
        u.name as user_name,
        c.created_at as activity_time
      FROM comments c
      JOIN news n ON n.id = c.news_id
      JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
      LIMIT 20)
      ORDER BY activity_time DESC
      LIMIT 20`,
    );

    // Get daily views for the last 7 days
    const [dailyViews] = await pool.query(
      `SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as count
      FROM views
      WHERE viewed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(viewed_at)
      ORDER BY date ASC`,
    );

    console.log("✅ Statistics retrieved successfully");

    res.json({
      newsStats,
      totals: totals[0],
      activeUsers,
      recentActivity,
      dailyViews,
    });
  } catch (error) {
    console.error("Error getting statistics:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
};

export default { trackView, getStatistics };
