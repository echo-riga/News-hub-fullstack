// backend/routes/newsRoutes.js - UPDATE THIS
import express from "express";
import newsController from "../controllers/newsController.js";

const router = express.Router();

// IMPORTANT: Order matters! More specific routes first
// Get all news (no pagination) - for tag counts
router.get("/all", newsController.getAllNews);

// Get paginated news (with optional filtering)
router.get("/", newsController.getNews);

// Get single news by ID (must be after "/" and "/all")
router.get("/:id", newsController.getNewsById);

export default router;
