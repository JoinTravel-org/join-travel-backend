import logger from "../config/logger.js";
import UserRepository from "../repository/user.repository.js";
import emailService from "./email.service.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { AppDataSource } from "../load/typeorm.loader.js";
import RevokedToken from "../models/revokedToken.model.js";
import { isValidEmail, validatePassword } from "../utils/validators.js";
import { ValidationError, AuthenticationError, DatabaseError } from "../utils/customErrors.js";

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.emailService = emailService;
  }
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - { email, password }
   * @returns {Promise<Object>} - { user, message }
   */
  async register({ email, password }) {
    // 1. Validar formato de email
    if (!isValidEmail(email)) {
      throw new ValidationError("Formato de correo inválido.");
    }

    // 2. Validar requisitos de contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError("La contraseña no cumple con los requisitos.", passwordValidation.errors);
    }

    // 3. Verificar que el email no exista
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError("El email ya está en uso. Intente iniciar sesión.");
    }

    // 4. Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Generar token de confirmación
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    logger.info("CONFIRMATION TOKEN: ", confirmationToken);
    // Date.now() retorna timestamp en UTC, la fecha se guarda en UTC en PostgreSQL
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas desde ahora (UTC)

    // 6. Crear usuario
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      emailConfirmationToken: confirmationToken,
      emailConfirmationExpires: tokenExpiration,
      isEmailConfirmed: false,
    });

    // 7. Enviar correo de confirmación (en segundo plano con timeout de 30 segundos)
    let emailPromise;
    if (process.env.NODE_ENV === 'test') {
      // En tests, no enviar email, solo simular
      emailPromise = Promise.resolve();
    } else {
      emailPromise = emailService.sendConfirmationEmail(
        email,
        confirmationToken
      );
    }

    // Timeout de 30 segundos para el envío del email
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout al enviar correo")), 30000)
    );

    try {
      await Promise.race([emailPromise, timeoutPromise]);
    } catch (error) {
      // Si falla el envío del email, registramos el error pero no cancelamos el registro
      console.error("Error al enviar correo de confirmación:", error);
      // Podríamos marcar el usuario para reenviar el correo después
    }

    // 8. Retornar usuario (sin la contraseña)
    const {
      password: _,
      emailConfirmationToken: __,
      ...userWithoutSensitiveData
    } = user;

    // En tests, confirmar automáticamente
    if (process.env.NODE_ENV === 'test') {
      await this.userRepository.update(user.id, {
        isEmailConfirmed: true,
        emailConfirmationToken: null,
        emailConfirmationExpires: null,
      });
    }

    return {
      user: userWithoutSensitiveData,
      confirmationToken: process.env.NODE_ENV === 'test' ? confirmationToken : undefined,
      message:
        "Usuario registrado exitosamente. Por favor revisa tu correo para confirmar tu cuenta.",
    };
  }

  async login({ email, password }) {
    // 1. Verificar que el usuario exista
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError("Credenciales inválidas.");
    }

    // 2. Verificar que el email esté confirmado
    if (!user.isEmailConfirmed) {
      throw new AuthenticationError("El email no ha sido confirmado.");
    }

    // 3. Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Credenciales inválidas.");
    }

    // 4. Generar tokens JWT
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  /**
   * Confirma el email de un usuario
   * @param {string} token - Token de confirmación
   * @returns {Promise<Object>} - { message }
   */
  async confirmEmail(token) {
    const user = await this.userRepository.findByConfirmationToken(token);

    if (!user) {
      throw new ValidationError("Token de confirmación inválido.");
    }

    // Comparar fecha actual (UTC) con fecha de expiración (UTC)
    const now = new Date(); // Fecha actual en UTC
    if (now > user.emailConfirmationExpires) {
      throw new ValidationError("El token de confirmación ha expirado.");
    }

    await this.userRepository.update(user.id, {
      isEmailConfirmed: true,
      emailConfirmationToken: null,
      emailConfirmationExpires: null,
    });

    // Award profile_completed action to enable level progression
    try {
      const gamificationService = (await import('./gamification.service.js')).default;
      await gamificationService.awardPoints(user.id, 'profile_completed', {}, false);
      logger.info(`Profile completed action awarded to user ${user.id} after email confirmation`);
    } catch (gamificationError) {
      console.error(`Failed to award profile_completed action for user ${user.id}:`, gamificationError);
      // Don't fail email confirmation if gamification fails
    }

    return { message: "Email confirmado exitosamente." };
  }

  async getOmegaAtus() {
    return this.userRepository.findAtus();
  }

  /**
   * Genera un access token JWT
   * @param {Object} user - Usuario
   * @returns {string} - Access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Genera un refresh token JWT
   * @param {Object} user - Usuario
   * @returns {string} - Refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Refresca un access token usando un refresh token válido
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - { accessToken, refreshToken }
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new AuthenticationError("Usuario no encontrado.");
      }

      // Generar nuevos tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new AuthenticationError("Refresh token inválido.");
    }
  }

  /**
   * Revoca un token (lo agrega a la blacklist)
   * @param {string} token - Token a revocar
   * @returns {Promise<void>}
   */
  async revokeToken(token) {
    try {
      // Decodificar sin verificar para obtener expiración
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new Error("Token inválido");
      }

      const expiresAt = new Date(decoded.exp * 1000);

      const revokedTokenRepo = AppDataSource.getRepository(RevokedToken);
      await revokedTokenRepo.save({
        token,
        expiresAt,
      });
    } catch (error) {
      console.error("Error revoking token:", error);
    }
  }

  /**
   * Verifica si un token está revocado
   * @param {string} token - Token a verificar
   * @returns {Promise<boolean>} - True si está revocado
   */
  async isTokenRevoked(token) {
    const revokedTokenRepo = AppDataSource.getRepository(RevokedToken);
    const revoked = await revokedTokenRepo.findOne({ where: { token } });
    return !!revoked;
  }

  /**
   * Solicita recuperación de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} - { message }
   */
  async forgotPassword(email) {
    // 1. Validar formato de email
    if (!isValidEmail(email)) {
      throw new ValidationError("Formato de correo inválido.");
    }

    // 2. Buscar usuario por email
    const user = await this.userRepository.findByEmail(email);
    
    // Criterio de aceptación 2: Si no existe el correo, mostrar mensaje específico
    if (!user) {
      throw new ValidationError("No existe una cuenta con este correo.");
    }

    // 3. Generar token de reseteo de contraseña
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Criterio de aceptación 4: El token debe durar 24 horas
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // 4. Guardar token en la base de datos
    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: tokenExpiration,
    });

    // 5. Enviar correo de recuperación
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
      throw new ValidationError("Error al enviar el correo de recuperación. Por favor intenta de nuevo.");
    }

    return {
      message: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
    };
  }

  /**
   * Restablece la contraseña usando un token
   * @param {string} token - Token de reseteo
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} - { message }
   */
  async resetPassword(token, newPassword) {
    // 1. Validar que se proporcione el token y la nueva contraseña
    if (!token || !newPassword) {
      throw new ValidationError("Token y contraseña son requeridos.");
    }

    // 2. Buscar usuario por token de reseteo
    const user = await this.userRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new ValidationError("Token de recuperación inválido o expirado.");
    }

    // 3. Verificar que el token no haya expirado
    const now = new Date();
    if (now > user.passwordResetExpires) {
      throw new ValidationError("El token de recuperación ha expirado. Por favor solicita uno nuevo.");
    }

    // 4. Validar requisitos de la nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError("La contraseña no cumple con los requisitos.", passwordValidation.errors);
    }

    // 5. Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 6. Actualizar contraseña y limpiar tokens de reseteo
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return {
      message: "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.",
    };
  }
}

export default new AuthService();
