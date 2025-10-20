import nodemailer from "nodemailer";
import config from "../config/index.js";

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
   * @returns {Promise<boolean>} - true si se envió correctamente
   */
  async sendConfirmationEmail(email, token) {
    try {
      const confirmationUrl = `${config.frontendUrl}/confirm-email?token=${token}`;

      const mailOptions = {
        from: `"JoinTravel" <${config.email.from}>`,
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
                    </div>
                `,
        text: `
                    ¡Bienvenido a JoinTravel!
                    
                    Gracias por registrarte. Para completar tu registro, por favor confirma tu correo electrónico visitando el siguiente enlace:
                    
                    ${confirmationUrl}
                    
                    Este enlace expirará en 24 horas.
                    
                    Si no creaste esta cuenta, puedes ignorar este correo.
                `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      throw new Error("Error al enviar el correo de confirmación");
    }
  }
}

export default new EmailService();
