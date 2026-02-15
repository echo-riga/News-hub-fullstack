import express from "express";
import userController from "../controllers/userController.js";
const router = express.Router();

router.post("/find-or-create", userController.getUserByName);

export default router;
