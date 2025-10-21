import { Router } from "express";
import { getMapsApiKey } from "../controllers/maps.controller.js";

const router = Router();

// @swagger-auto-hide
router.get("/key", getMapsApiKey);

export default router;