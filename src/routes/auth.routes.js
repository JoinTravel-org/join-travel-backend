import { Router } from "express";
import { getAtus } from "../controllers/auth.controller.js";

const router = Router();

router.get("/", getAtus);

export default router;
