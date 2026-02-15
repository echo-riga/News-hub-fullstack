import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Admin News API
export const adminNewsApi = {
  // Create news with image upload
  createNews: async (newsData) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add text fields
      formData.append("title", newsData.title);
      formData.append("caption", newsData.caption || "");
      formData.append("content", newsData.content);

      // Add tags if they exist - send as array
      if (newsData.tags && newsData.tags.length > 0) {
        newsData.tags.forEach((tagId) => {
          formData.append("tags", tagId);
        });
      }

      // Add image file if it exists
      if (newsData.image && newsData.image instanceof File) {
        formData.append("image", newsData.image);
      }

      const response = await axios.post(`${API_BASE}/admin/news`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        "Error creating news:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Update news (if you need it later)
  updateNews: async (id, newsData) => {
    try {
      const formData = new FormData();
      formData.append("title", newsData.title);
      formData.append("caption", newsData.caption || "");
      formData.append("content", newsData.content);

      if (newsData.tags && newsData.tags.length > 0) {
        newsData.tags.forEach((tagId) => {
          formData.append("tags", tagId);
        });
      }

      if (newsData.image && newsData.image instanceof File) {
        formData.append("image", newsData.image);
      } else if (newsData.image) {
        // If it's a URL string
        formData.append("imageUrl", newsData.image);
      }

      const response = await axios.put(
        `${API_BASE}/admin/news/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error updating news:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Other functions...
  getAllNews: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/news`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  },

  getNewsById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/news/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching news by ID:", error);
      throw error;
    }
  },

  deleteNews: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/admin/news/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting news:", error);
      throw error;
    }
  },
};

// Tags API remains the same...
export const tagsApi = {
  getTags: async () => {
    try {
      const response = await axios.get(`${API_BASE}/tags`);
      return response.data;
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  },

  createTag: async (tagName) => {
    try {
      const response = await axios.post(`${API_BASE}/tags`, { name: tagName });
      return response.data;
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/tags/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting tag:", error);
      throw error;
    }
  },
};
