import { Router } from "express";
import {
  getAtus,
  register,
  confirmEmail,
} from "../controllers/auth.controller.js";

const router = Router();

// Ruta de prueba
router.get("/", getAtus);

// Ruta de registro
router.post("/register", register);

// Ruta de confirmación de email
router.get("/confirm-email/:token", confirmEmail);

export default router;
