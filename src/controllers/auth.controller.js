import authService from "../services/auth.service.js";
import logger from "../config/logger.js";

/**
 * Registra un nuevo usuario
 * POST /api/auth/register
 * Body: { email, password }
 */
export const register = async (req, res, next) => {
  logger.info(`Register endpoint called with email: ${req.body.email}`);
  try {
    const { email, password } = req.body;

    // Validar que se envíen los campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos.",
      });
    }

    const result = await authService.register({ email, password });

    logger.info(`Register endpoint completed successfully for email: ${req.body.email}`);
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (err) {
    logger.error(`Register endpoint failed for email: ${req.body.email}, error: ${err.message}`);
    // Si el error tiene detalles (como errores de validación de contraseña)
    if (err.details) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        errors: err.details,
      });
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  logger.info(`Login endpoint called with email: ${req.body.email}`);
  try {
    const { email, password } = req.body;

    // Validar que se envíen los campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos.",
      });
    }

    const result = await authService.login({ email, password });
    logger.info(`Login endpoint completed successfully for email: ${req.body.email}`);
    res.status(200).json({
      success: true,
      message: "Login exitoso.",
      data: {
        token: result.token,
      },
    });
  } catch (err) {
    logger.error(`Login endpoint failed for email: ${req.body.email}, error: ${err.message}`);
    next(err);  
  }
};
/**
 * Confirma el email de un usuario
 * GET /api/auth/confirm-email/:token
 */
export const confirmEmail = async (req, res, next) => {
  logger.info(`Confirm email endpoint called with token: ${req.params.token}`);
  try {
    const { token } = req.params;

    const result = await authService.confirmEmail(token);

    logger.info(`Confirm email endpoint completed successfully for token: ${req.params.token}`);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    logger.error(`Confirm email endpoint failed for token: ${req.params.token}, error: ${err.message}`);
    next(err);
  }
};


export const getAtus = async (_req, res, next) => {
  logger.info(`Get Atus endpoint called`);
  try {
    const atus = await authService.getOmegaAtus();
    logger.info(`Get Atus endpoint completed successfully`);
    res.json({ success: true, data: atus });
  } catch (err) {
    logger.error(`Get Atus endpoint failed, error: ${err.message}`);
    next(err);
  }
};
