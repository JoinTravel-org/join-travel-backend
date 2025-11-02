import UserRepository from "../repository/user.repository.js";
import gamificationService from "../services/gamification.service.js";
import logger from "../config/logger.js";
import { ValidationError } from "../utils/customErrors.js";

/**
 * Busca usuarios por email
 * GET /api/users/search?email=<email>
 */
export const searchUsers = async (req, res, next) => {
  logger.info(`Search users endpoint called with email: ${req.query.email}`);

  try {
    const { email } = req.query;

    // Validar que se proporcione el parámetro email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new ValidationError("El parámetro 'email' es requerido y debe ser una cadena no vacía.");
    }

    // Limitar la longitud del email para prevenir búsquedas demasiado amplias
    if (email.length < 2) {
      throw new ValidationError("El email debe tener al menos 2 caracteres para la búsqueda.");
    }

    // Buscar usuarios
    const userRepo = new UserRepository();
    const users = await userRepo.searchByEmail(email.trim(), 20);

    // Formatear respuesta con stats si están disponibles
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        let stats = null;
        try {
          stats = await gamificationService.getUserStats(user.id);
        } catch (statsError) {
          logger.warn(`Failed to get stats for user ${user.id}:`, statsError.message);
          // Continuar sin stats si hay error
        }

        return {
          id: user.id,
          email: user.email,
          isEmailConfirmed: user.isEmailConfirmed,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats
        };
      })
    );

    logger.info(`Search users endpoint completed successfully, found ${formattedUsers.length} users`);

    res.status(200).json({
      success: true,
      data: formattedUsers,
      message: null
    });

  } catch (err) {
    logger.error(`Search users endpoint failed: ${err.message}`);
    next(err);
  }
};