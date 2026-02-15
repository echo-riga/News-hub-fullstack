import express from "express";
import tagController from "../controllers/tagController.js";

const router = express.Router();

router.get("/", tagController.getTags);
router.post("/", tagController.createTag);
router.delete("/:id", tagController.deleteTag);

export default router;
