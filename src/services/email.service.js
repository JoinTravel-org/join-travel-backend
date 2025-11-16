import nodemailer from "nodemailer";
import config from "../config/index.js";
import { ExternalServiceError } from "../utils/customErrors.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Configuración del transporter
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure, // true para 465, false para otros puertos
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  /**
   * Envía un correo de confirmación de registro
   * @param {string} email - Email del destinatario
   * @param {string} token - Token de confirmación
   * @param {string} [profilePicture] - URL o path de la imagen de perfil del remitente
   * @returns {Promise<boolean>} - true si se envió correctamente
   */
  async sendConfirmationEmail(email, token) {
    try {
      const confirmationUrl = `${config.frontendUrl}/confirm-email?token=${token}`;

      // Preparar attachments
      const attachments = [
        {
          filename: 'logo-32x32.png',
          path: './src/assets/logo-32x32.png',
          cid: 'logo'
        }
      ];

      const mailOptions = {
        from: `${config.email.from}`,
        to: email,
        subject: "Confirma tu registro en JoinTravel",
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">¡Bienvenido a JoinTravel!</h1>
                        <p>Gracias por registrarte. Para completar tu registro, por favor confirma tu correo electrónico haciendo clic en el siguiente enlace:</p>
                        <a href="${confirmationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                            Confirmar mi correo
                        </a>
                        <p>Este enlace expirará en 24 horas.</p>
                        <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">JoinTravel - Tu compañero de viajes</p>
                        <img src="cid:logo" alt="JoinTravel Logo" style="max-width: 32px;">
                    </div>
                `,
        text: `
                    ¡Bienvenido a JoinTravel!

                    Gracias por registrarte. Para completar tu registro, por favor confirma tu correo electrónico visitando el siguiente enlace:

                    ${confirmationUrl}

                    Este enlace expirará en 24 horas.

                    Si no creaste esta cuenta, puedes ignorar este correo.
                `,
        attachments: attachments
      };

      // Add timeout to email sending (30 seconds)
      const emailPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new ExternalServiceError("Email service timeout")), 30000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
      return true;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError("Error al enviar el correo de confirmación");
    }
  }

  /**
   * Envía una notificación de insignia ganada
   * @param {string} email - Email del destinatario
   * @param {Object} badge - Datos de la insignia
   * @returns {Promise<boolean>} - true si se envió correctamente
   */
  async sendBadgeNotification(email, badge) {
    try {
      // Preparar attachments
      const attachments = [
        {
          filename: 'logo-32x32.png',
          path: './src/assets/logo-32x32.png',
          cid: 'logo'
        }
      ];

      const mailOptions = {
        from: `${config.email.from}`,
        to: email,
        subject: `¡Felicidades! Has ganado la insignia "${badge.name}" en JoinTravel`,
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">¡Felicidades! 🎉</h1>
                        <p>Has ganado una nueva insignia en JoinTravel:</p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                            <h2 style="color: #28a745; margin: 0;">${badge.name}</h2>
                            <p style="color: #666; margin: 10px 0 0 0;">${badge.description}</p>
                        </div>
                        <p>¡Sigue explorando y compartiendo tus experiencias de viaje para ganar más insignias!</p>
                        <a href="${config.frontendUrl}/profile" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                            Ver mi perfil
                        </a>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">JoinTravel - Tu compañero de viajes</p>
                        <img src="cid:logo" alt="JoinTravel Logo" style="max-width: 32px;">
                    </div>
                `,
        text: `
                    ¡Felicidades!

                    Has ganado una nueva insignia en JoinTravel:

                    ${badge.name}
                    ${badge.description}

                    ¡Sigue explorando y compartiendo tus experiencias de viaje para ganar más insignias!

                    Ver mi perfil: ${config.frontendUrl}/profile
                `,
        attachments: attachments
      };

      // Add timeout to email sending (30 seconds)
      const emailPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new ExternalServiceError("Email service timeout")), 30000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
      return true;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError("Error al enviar la notificación de insignia");
    }
  }

  /**
   * Envía un correo de recuperación de contraseña
   * @param {string} email - Email del destinatario
   * @param {string} token - Token de reseteo de contraseña
   * @returns {Promise<boolean>} - true si se envió correctamente
   */
  async sendPasswordResetEmail(email, token) {
    try {
      const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

      // Preparar attachments
      const attachments = [
        {
          filename: 'logo-32x32.png',
          path: './src/assets/logo-32x32.png',
          cid: 'logo'
        }
      ];

      const mailOptions = {
        from: `${config.email.from}`,
        to: email,
        subject: "Recuperación de contraseña - JoinTravel",
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">Recuperación de contraseña</h1>
                        <p>Has solicitado restablecer tu contraseña en JoinTravel.</p>
                        <p>Para crear una nueva contraseña, haz clic en el siguiente enlace:</p>
                        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                            Restablecer mi contraseña
                        </a>
                        <p style="color: #d9534f; font-weight: bold;">Este enlace expirará en 24 horas.</p>
                        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña no será cambiada.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">JoinTravel - Tu compañero de viajes</p>
                        <img src="cid:logo" alt="JoinTravel Logo" style="max-width: 32px;">
                    </div>
                `,
        text: `
                    Recuperación de contraseña - JoinTravel

                    Has solicitado restablecer tu contraseña en JoinTravel.

                    Para crear una nueva contraseña, visita el siguiente enlace:

                    ${resetUrl}

                    Este enlace expirará en 24 horas.

                    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña no será cambiada.
                `,
        attachments: attachments
      };

      // Add timeout to email sending (30 seconds)
      const emailPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new ExternalServiceError("Email service timeout")), 30000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
      return true;
    } catch (error) {
      console.error("Error detallado al enviar correo de recuperación:", error);
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError("Error al enviar el correo de recuperación");
    }
  }
}

export default new EmailService();
