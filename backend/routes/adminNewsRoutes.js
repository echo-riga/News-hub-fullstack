import express from "express";
import adminNewsController from "../controllers/adminNewsController.js";
import upload from "../config/multerConfig.js";

const router = express.Router();

router.get("/", adminNewsController.getAllNews);
router.get("/:id", adminNewsController.getNewsById);
router.post("/", upload.single("image"), adminNewsController.createNews); // Add upload middleware
router.delete("/:id", adminNewsController.deleteNews);

export default router;
