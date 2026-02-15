// backend/sockets/commentSockets.js - COMPLETE COMMENTS SOCKET
import pool from "../db.js";

const initCommentSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("Comment socket connected:", socket.id);

    // Fetch comments for a news item
    socket.on("fetch-comments", async ({ newsId }) => {
      try {
        const [comments] = await pool.query(
          `SELECT 
            c.id,
            c.comment,
            c.created_at,
            c.user_id,
            u.name as user_name
          FROM comments c
          JOIN users u ON u.id = c.user_id
          WHERE c.news_id = ?
          ORDER BY c.created_at DESC`,
          [newsId],
        );

        socket.emit(`comments-loaded-${newsId}`, { comments });
      } catch (err) {
        console.error("fetch-comments error:", err);
        socket.emit("comment-error", { message: "Failed to load comments" });
      }
    });

    // Add a new comment
    socket.on("add-comment", async ({ newsId, userId, comment }) => {
      try {
        if (!comment || !comment.trim()) {
          socket.emit("comment-error", { message: "Comment cannot be empty" });
          return;
        }

        // Insert comment
        const [result] = await pool.query(
          "INSERT INTO comments (news_id, user_id, comment) VALUES (?, ?, ?)",
          [newsId, userId, comment.trim()],
        );

        // Get the newly created comment with user info
        const [newComment] = await pool.query(
          `SELECT 
            c.id,
            c.comment,
            c.created_at,
            c.user_id,
            u.name as user_name
          FROM comments c
          JOIN users u ON u.id = c.user_id
          WHERE c.id = ?`,
          [result.insertId],
        );

        // Get updated comment count
        const [countResult] = await pool.query(
          "SELECT COUNT(*) as count FROM comments WHERE news_id = ?",
          [newsId],
        );

        // Broadcast new comment to all clients
        io.emit(`new-comment-${newsId}`, {
          comment: newComment[0],
          totalComments: countResult[0].count,
        });

        // Also update comment count for the news card
        io.emit(`news-comment-updated-${newsId}`, {
          count: countResult[0].count,
        });
      } catch (err) {
        console.error("add-comment error:", err);
        socket.emit("comment-error", { message: "Failed to add comment" });
      }
    });

    // Delete a comment
    socket.on("delete-comment", async ({ commentId, userId, newsId }) => {
      try {
        // Check if user owns the comment
        const [comment] = await pool.query(
          "SELECT user_id FROM comments WHERE id = ?",
          [commentId],
        );

        if (comment.length === 0) {
          socket.emit("comment-error", { message: "Comment not found" });
          return;
        }

        if (comment[0].user_id !== userId) {
          socket.emit("comment-error", {
            message: "You can only delete your own comments",
          });
          return;
        }

        // Delete comment
        await pool.query("DELETE FROM comments WHERE id = ?", [commentId]);

        // Get updated comment count
        const [countResult] = await pool.query(
          "SELECT COUNT(*) as count FROM comments WHERE news_id = ?",
          [newsId],
        );

        // Broadcast deletion to all clients
        io.emit(`comment-deleted-${newsId}`, {
          commentId,
          totalComments: countResult[0].count,
        });

        // Update comment count for the news card
        io.emit(`news-comment-updated-${newsId}`, {
          count: countResult[0].count,
        });
      } catch (err) {
        console.error("delete-comment error:", err);
        socket.emit("comment-error", { message: "Failed to delete comment" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Comment socket disconnected:", socket.id);
    });
  });
};

export default initCommentSockets;
