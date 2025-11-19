import authService from "../services/auth.service.js";
import logger from "../config/logger.js";
import { ValidationError, AuthenticationError } from "../utils/customErrors.js";

/**
 * Registra un nuevo usuario
 * POST /api/auth/register
 * Body: { email, password, name (optional), age (optional) }
 */
export const register = async (req, res, next) => {
  logger.info(`Register endpoint called with email: ${req.body.email}`);
  try {
    const { email, password, name, age } = req.body;

    // Validar que se envíen los campos requeridos
    if (!email || !password) {
      throw new ValidationError("Email y contraseña son requeridos.");
    }

    const result = await authService.register({ email, password, name, age });

    logger.info(`Register endpoint completed successfully for email: ${req.body.email}`);
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.user,
      ...(process.env.NODE_ENV === 'test' && { confirmationToken: result.confirmationToken }),
    });
  } catch (err) {
    logger.error(`Register endpoint failed for email: ${req.body.email}, error: ${err.message}`);
    next(err);
  }
};

export const login = async (req, res, next) => {
  logger.info(`Login endpoint called with email: ${req.body.email}`);
  try {
    const { email, password } = req.body;

    // Validar que se envíen los campos requeridos
    if (!email || !password) {
      throw new ValidationError("Email y contraseña son requeridos.");
    }

    const result = await authService.login({ email, password });
    logger.info(`Login endpoint completed successfully for email: ${req.body.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          isEmailConfirmed: result.user.isEmailConfirmed,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
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

/**
 * Get user profile
 * GET /api/auth/
 */
export const getProfile = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

/**
 * Logout - revoca el token actual
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <token>
 */
export const logout = async (req, res, next) => {
  logger.info(`Logout endpoint called`);
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      await authService.revokeToken(token);
    }

    logger.info(`Logout endpoint completed successfully`);
    res.status(200).json({
      success: true,
      message: "Logout exitoso.",
    });
  } catch (err) {
    logger.error(`Logout endpoint failed, error: ${err.message}`);
    next(err);
  }
};

/**
 * Refresca un access token usando un refresh token
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
export const refreshToken = async (req, res, next) => {
  logger.info(`Refresh token endpoint called`);
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError("Refresh token es requerido.");
    }

    const result = await authService.refreshToken(refreshToken);

    logger.info(`Refresh token endpoint completed successfully`);
    res.status(200).json({
      success: true,
      message: "Token refrescado exitosamente.",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (err) {
    logger.error(`Refresh token endpoint failed, error: ${err.message}`);
    next(err);
  }
};

/**
 * Solicita recuperación de contraseña
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (req, res, next) => {
  logger.info(`Forgot password endpoint called with email: ${req.body.email}`);
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("El email es requerido.");
    }

    const result = await authService.forgotPassword(email);

    logger.info(`Forgot password endpoint completed successfully for email: ${req.body.email}`);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    logger.error(`Forgot password endpoint failed for email: ${req.body.email}, error: ${err.message}`);
    next(err);
  }
};

/**
 * Restablece la contraseña usando un token
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
export const resetPassword = async (req, res, next) => {
  logger.info(`Reset password endpoint called`);
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ValidationError("Token y contraseña son requeridos.");
    }

    const result = await authService.resetPassword(token, password);

    logger.info(`Reset password endpoint completed successfully`);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    logger.error(`Reset password endpoint failed, error: ${err.message}`);
    next(err);
  }
};
