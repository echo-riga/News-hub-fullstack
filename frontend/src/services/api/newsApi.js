// services/api/newsApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const fetchNews = async (lastSeenId = null, tag = null) => {
  try {
    const params = {};
    if (lastSeenId) {
      params.last_seen_id = lastSeenId; // ✅ Change to match backend
    }
    if (tag) {
      params.tag = tag;
    }

    // Add timestamp to prevent caching
    params._t = Date.now();

    console.log(`📡 API Call: /api/news with params:`, params);

    const response = await axios.get(`${API_BASE}/news`, {
      params,
      timeout: 5000,
    });

    console.log(`✅ API Response: ${response.data.length} items`);

    return response.data;
  } catch (err) {
    console.error("❌ API Error:", err.message);
    throw err;
  }
};
export const fetchNewsDetails = async (newsId) => {
  try {
    const response = await axios.get(`${API_BASE}/news/${newsId}`, {
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching news details:", err.message);
    throw err;
  }
};

// Like a news article
export const likeNews = async (newsId, userId) => {
  try {
    const response = await axios.post(`${API_BASE}/news/${newsId}/like`, {
      user_id: userId,
    });
    return response.data;
  } catch (err) {
    console.error("Error liking news:", err.message);
    throw err;
  }
};

// Unlike a news article
export const unlikeNews = async (newsId, userId) => {
  try {
    const response = await axios.delete(
      `${API_BASE}/news/${newsId}/like/${userId}`,
    );
    return response.data;
  } catch (err) {
    console.error("Error unliking news:", err.message);
    throw err;
  }
};

// Add comment
export const addComment = async (newsId, userId, comment) => {
  try {
    const response = await axios.post(`${API_BASE}/news/${newsId}/comment`, {
      user_id: userId,
      comment: comment,
    });
    return response.data;
  } catch (err) {
    console.error("Error adding comment:", err.message);
    throw err;
  }
};

// Delete comment
export const deleteComment = async (commentId) => {
  try {
    const response = await axios.delete(`${API_BASE}/comments/${commentId}`);
    return response.data;
  } catch (err) {
    console.error("Error deleting comment:", err.message);
    throw err;
  }
};
