import authService from "../services/auth.service.js";

/**
 * Registra un nuevo usuario
 * POST /api/auth/register
 * Body: { email, password }
 */
export const register = async (req, res, next) => {
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

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (err) {
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

/**
 * Confirma el email de un usuario
 * GET /api/auth/confirm-email/:token
 */
export const confirmEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await authService.confirmEmail(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

export const getAtus = async (_req, res, next) => {
  try {
    const atus = await authService.getOmegaAtus();
    res.json({ success: true, data: atus });
  } catch (err) {
    next(err);
  }
};
