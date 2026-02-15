// backend/routes/viewRoutes.js - NEW FILE
import express from "express";
import viewController from "../controllers/viewController.js";

const router = express.Router();

router.post("/track", viewController.trackView);
router.get("/statistics", viewController.getStatistics);

export default router;
