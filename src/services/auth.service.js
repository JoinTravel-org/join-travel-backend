import userRepository from "../repository/user.repository.js";
import emailService from "./email.service.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { isValidEmail, validatePassword } from "../utils/validators.js";

class AuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - { email, password }
   * @returns {Promise<Object>} - { user, message }
   */
  async register({ email, password }) {
    // 1. Validar formato de email
    if (!isValidEmail(email)) {
      const error = new Error("Formato de correo inválido.");
      error.status = 400;
      throw error;
    }

    // 2. Validar requisitos de contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error("La contraseña no cumple con los requisitos.");
      error.status = 400;
      error.details = passwordValidation.errors;
      throw error;
    }

    // 3. Verificar que el email no exista
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error(
        "El email ya está en uso. Intente iniciar sesión."
      );
      error.status = 409;
      throw error;
    }

    // 4. Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Generar token de confirmación
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    // Date.now() retorna timestamp en UTC, la fecha se guarda en UTC en PostgreSQL
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas desde ahora (UTC)

    // 6. Crear usuario
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      emailConfirmationToken: confirmationToken,
      emailConfirmationExpires: tokenExpiration,
      isEmailConfirmed: false,
    });

    // 7. Enviar correo de confirmación (en segundo plano con timeout de 30 segundos)
    const emailPromise = emailService.sendConfirmationEmail(
      email,
      confirmationToken
    );

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

    return {
      user: userWithoutSensitiveData,
      message:
        "Usuario registrado exitosamente. Por favor revisa tu correo para confirmar tu cuenta.",
    };
  }

  async login({ email, password }) {
    // 1. Verificar que el usuario exista
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error("Credenciales inválidas.");
      error.status = 401;
      throw error;
    }

    // 2. Verificar que el email esté confirmado
    if (!user.isEmailConfirmed) {
      const error = new Error("El email no ha sido confirmado.");
      error.status = 403;
      throw error;
    }

    // 3. Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error("Credenciales inválidas.");
      error.status = 401;
      throw error;
    }

    // 4. Generar token JWT (aquí simplemente retornamos un token simulado)
    const token = crypto.randomBytes(16).toString("hex"); // Simulación

    return { token };
  }

  /**
   * Confirma el email de un usuario
   * @param {string} token - Token de confirmación
   * @returns {Promise<Object>} - { message }
   */
  async confirmEmail(token) {
    const user = await userRepository.findByConfirmationToken(token);

    if (!user) {
      const error = new Error("Token de confirmación inválido.");
      error.status = 400;
      console.log(error);
      throw error;
    }

    // Comparar fecha actual (UTC) con fecha de expiración (UTC)
    const now = new Date(); // Fecha actual en UTC
    if (now > user.emailConfirmationExpires) {
      const error = new Error("El token de confirmación ha expirado.");
      error.status = 400;
      console.log(error);
      throw error;
    }

    await userRepository.update(user.id, {
      isEmailConfirmed: true,
      emailConfirmationToken: null,
      emailConfirmationExpires: null,
    });

    return { message: "Email confirmado exitosamente." };
  }

  async getOmegaAtus() {
    return userRepository.findAtus();
  }
}

export default new AuthService();
