import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getAtus,
  register,
  login,
  confirmEmail,
  refreshToken,
  logout,
  getProfile,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ruta de prueba
router.get("/", authenticate, getProfile);

// Ruta de registro
router.post("/register", authLimiter, register);

router.post("/login", authLimiter, login);

// Ruta de refresh token
router.post("/refresh", refreshToken);

// Ruta de logout
router.post("/logout", logout);

// Ruta de confirmación de email
router.get("/confirm-email/:token", confirmEmail);

export default router;
