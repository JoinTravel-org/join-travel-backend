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

    return { accessToken, refreshToken };
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
}

export default new AuthService();
