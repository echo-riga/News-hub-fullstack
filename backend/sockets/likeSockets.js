// initLikeSockets.js - COMPLETED
import pool from "../db.js";

const initLikeSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("Like socket connected:", socket.id);

    // User likes a news item
    socket.on("like-news", async ({ newsId, userId }) => {
      try {
        await pool.query(
          "INSERT INTO likes (news_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE news_id=news_id",
          [newsId, userId],
        );

        // Get updated like count and user's like status
        const [rows] = await pool.query(
          "SELECT COUNT(*) as count FROM likes WHERE news_id = ?",
          [newsId],
        );

        io.emit(`news-like-updated-${newsId}`, {
          count: rows[0].count,
          newsId: newsId,
        });
      } catch (err) {
        console.error("like-news error:", err);
        socket.emit("like-error", { message: "Failed to like news" });
      }
    });

    // User unlikes a news item
    socket.on("unlike-news", async ({ newsId, userId }) => {
      try {
        await pool.query(
          "DELETE FROM likes WHERE news_id = ? AND user_id = ?",
          [newsId, userId],
        );

        // Get updated like count
        const [rows] = await pool.query(
          "SELECT COUNT(*) as count FROM likes WHERE news_id = ?",
          [newsId],
        );

        io.emit(`news-like-updated-${newsId}`, {
          count: rows[0].count,
          newsId: newsId,
        });
      } catch (err) {
        console.error("unlike-news error:", err);
        socket.emit("unlike-error", { message: "Failed to unlike news" });
      }
    });

    // Check if user has liked a news item
    socket.on("check-like-status", async ({ newsId, userId }) => {
      try {
        const [rows] = await pool.query(
          "SELECT 1 FROM likes WHERE news_id = ? AND user_id = ? LIMIT 1",
          [newsId, userId],
        );

        socket.emit(`like-status-${newsId}`, {
          isLiked: rows.length > 0,
          newsId: newsId,
        });
      } catch (err) {
        console.error("check-like-status error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Like socket disconnected:", socket.id);
    });
  });
};

export default initLikeSockets;
