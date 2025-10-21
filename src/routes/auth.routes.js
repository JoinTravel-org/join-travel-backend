import { Router } from "express";
import {
  getAtus,
  register,
  login,
  confirmEmail,
} from "../controllers/auth.controller.js";

const router = Router();

// Ruta de prueba
router.get("/", getAtus);

// Ruta de registro
router.post("/register", register);

router.post("/login", login);

// Ruta de confirmación de email
router.get("/confirm-email/:token", confirmEmail);

export default router;
