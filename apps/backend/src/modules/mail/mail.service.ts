import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  private readonly defaultSenderName = 'AYNI';
  // El dominio ya se encuentra habilitado en Resend.
  private readonly defaultSenderEmail = 'hola@tripleimpacto.site';

  constructor(private readonly configService: ConfigService) {
    const rawEnv = process.env.RESEND_API_KEY;
    const configEnv = this.configService.get<string>('RESEND_API_KEY');
    const apiKey = configEnv || rawEnv;
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY no está configurada ni en ConfigService ni en process.env.');
      // Inicializamos con un valor falso para evitar que la app crashee en el arranque.
      this.resend = new Resend('re_dummy_para_evitar_crasheo');
    } else {
      this.logger.log(`Resend API Key leída exitosamente: ${apiKey.substring(0, 5)}...`);
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Envia un correo de bienvenida con el botón de verificación.
   * Utiliza el e-mail del remitente del onboarding si el dominio oficial no está validado.
   */
  async sendVerificationEmail(userEmail: string, userName: string, token: string) {
    // La URL debe apuntar al Backend, que procesa y luego redirecciona al Front
    // Priorizamos API_BASE_URL (produccion/ngrok) sobre API_URL o localhost:3000
    const baseUrl = this.configService.get<string>('API_BASE_URL') || this.configService.get<string>('API_URL') || 'http://localhost:3000';
    const verifyLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.defaultSenderName} <${this.defaultSenderEmail}>`,
        to: [userEmail],
        subject: '¡Te damos la bienvenida a AYNI!',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #40a8ab; padding: 30px; text-align: center;">
              <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto/f_auto/v1775685229/ISOLOGOTIPO_AYNI_FONDO_TRANSPARENTE_iwyuaw.png" alt="AYNI Logo" style="height: 50px;" />
            </div>
            <div style="padding: 40px 30px;">
              <h1 style="color: #40a8ab; font-size: 24px; margin-bottom: 20px;">¡Hola, ${userName}! 👋</h1>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Nos alegra muchísimo que te hayas sumado a la comunidad oficial de <strong>AYNI</strong>. 
                Para mantener la seguridad de tu cuenta, necesitamos que confirmes tu dirección de correo electrónico.
              </p>
              <div style="text-align: center; margin-bottom: 30px; margin-top: 30px;">
                <a href="${verifyLink}" style="display: inline-block; background-color: #40a8ab; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Confirmar mi correo
                </a>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 30px;">
                Cualquier duda que tengas sobre la plataforma, donaciones o empresas, nuestro equipo 
                estará encantado de ayudarte respondiendo a este mismo correo.
              </p>
            </div>
            <div style="background-color: #f7f9fc; padding: 20px; text-align: center; color: #718096; font-size: 12px;">
              <p style="margin: 0;">AYNI - Plataforma Fintech de Reciprocidad</p>
            </div>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Error de envío de Resend hacia ${userEmail}:`, error);
        return false;
      }

      this.logger.log(`✅ Correo de bienvenida enviado exitosamente a: ${userEmail}. Job ID: ${data?.id}`);
      return true;
    } catch (err) {
      this.logger.error(`Excepción al intentar enviar correo a ${userEmail}:`, err);
      return false;
    }
  }

  /**
   * Envia un correo de restablecimiento de contraseña.
   */
  async sendPasswordResetEmail(userEmail: string, userName: string, token: string) {
    // La URL debe apuntar al Frontend, donde estará dibujado el formulario con los inputs nuevos
    const frontUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetLink = `${frontUrl}/reset-password?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.defaultSenderName} <${this.defaultSenderEmail}>`,
        to: [userEmail],
        subject: 'Recuperación de contraseña - AYNI',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #40a8ab; padding: 30px; text-align: center;">
              <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto/f_auto/v1775685229/ISOLOGOTIPO_AYNI_FONDO_TRANSPARENTE_iwyuaw.png" alt="AYNI Logo" style="height: 50px;" />
            </div>
            <div style="padding: 40px 30px;">
              <h1 style="color: #40a8ab; font-size: 24px; margin-bottom: 20px;">¡Hola, ${userName}!</h1>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hemos recibido una solicitud para restablecer tu contraseña en <strong>AYNI</strong>.
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Para elegir una nueva clave, hacé clic en el botón inferior. Por motivos de seguridad este enlace solo será válido por <strong>1 hora</strong>.
              </p>
              <div style="text-align: center; margin-bottom: 30px; margin-top: 30px;">
                <a href="${resetLink}" style="display: inline-block; background-color: #40a8ab; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Cambiar Contraseña
                </a>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 30px;">
                Si tú no solicitaste este cambio, simplemente ignorá este correo y tu cuenta seguirá protegida.
              </p>
            </div>
            <div style="background-color: #f7f9fc; padding: 20px; text-align: center; color: #718096; font-size: 12px;">
              <p style="margin: 0;">AYNI - Plataforma Fintech de Reciprocidad</p>
              <p style="margin: 5px 0 0 0;">Este es un correo automático de seguridad.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Error de envío de Resend hacia ${userEmail}:`, error);
        return false;
      }

      this.logger.log(`✅ Correo de reseteo enviado exitosamente a: ${userEmail}. Job ID: ${data?.id}`);
      return true;
    } catch (err) {
      this.logger.error(`Excepción al intentar enviar correo de reseteo a ${userEmail}:`, err);
      return false;
    }
  }

  /**
   * Envia un correo de bienvenida al Newsletter.
   */
  async sendNewsletterWelcomeEmail(userEmail: string) {
    const frontUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.defaultSenderName} <${this.defaultSenderEmail}>`,
        to: [userEmail],
        subject: '¡Bienvenido(a) a la comunidad AYNI! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #40a8ab; padding: 30px; text-align: center;">
              <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto/f_auto/v1775685229/ISOLOGOTIPO_AYNI_FONDO_TRANSPARENTE_iwyuaw.png" alt="AYNI Logo" style="height: 50px;" />
            </div>
            <div style="padding: 40px 30px;">
              <h1 style="color: #40a8ab; font-size: 24px; margin-bottom: 20px;">¡Gracias por sumarte!</h1>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Confirmamos tu suscripción al <strong>Newsletter de AYNI</strong>. A partir de ahora estarás al tanto de todas las novedades y nuestros avances de triple impacto.
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Si sos nuevo en nuestra plataforma, te invitamos a explorar nuestra web y conocer más sobre nuestra propuesta de beneficios y ayuda social.
              </p>
              <div style="text-align: center; margin-bottom: 30px; margin-top: 30px;">
                <a href="${frontUrl}" style="display: inline-block; background-color: #40a8ab; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Visitar AYNI
                </a>
              </div>
            </div>
            <div style="background-color: #f7f9fc; padding: 20px; text-align: center; color: #718096; font-size: 12px;">
              <p style="margin: 0;">AYNI - Plataforma Fintech de Reciprocidad</p>
              <p style="margin: 5px 0 0 0;">Si no solicitaste esto, ignora este correo.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Error de envío Newsletter a ${userEmail}:`, error);
        return false;
      }

      this.logger.log(`✅ Correo Newsletter enviado a: ${userEmail}. Job ID: ${data?.id}`);
      return true;
    } catch (err) {
      this.logger.error(`Excepción al intentar enviar Newsletter a ${userEmail}:`, err);
      return false;
    }
  }
  /**
   * Envia el correo desde el formulario de contacto.
   */
  async sendContactEmail(nombre: string, email: string, telefono: string, asunto: string, mensaje: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.defaultSenderName} <${this.defaultSenderEmail}>`,
        to: ['jorge.castro.cruz@hotmail.com'],
        replyTo: email,
        subject: `Nuevo Mensaje de Contacto: ${asunto}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #40a8ab; padding: 30px; text-align: center;">
              <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto/f_auto/v1775685229/ISOLOGOTIPO_AYNI_FONDO_TRANSPARENTE_iwyuaw.png" alt="AYNI Logo" style="height: 50px;" />
            </div>
            <div style="padding: 40px 30px;">
              <h1 style="color: #40a8ab; font-size: 24px; margin-bottom: 20px;">Nuevo Mensaje de Contacto</h1>
              <p><strong>Nombre:</strong> ${nombre}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Teléfono:</strong> ${telefono || 'No proporcionado'}</p>
              <p><strong>Asunto:</strong> ${asunto}</p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p><strong>Mensaje:</strong></p>
              <p style="white-space: pre-wrap;">${mensaje}</p>
            </div>
            <div style="background-color: #f7f9fc; padding: 20px; text-align: center; color: #718096; font-size: 12px;">
              <p style="margin: 0;">AYNI - Plataforma Fintech de Reciprocidad</p>
            </div>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Error enviando correo de contacto de ${email}:`, error);
        return false;
      }

      this.logger.log(`✅ Correo de contacto enviado. Job ID: ${data?.id}`);
      return true;
    } catch (err) {
      this.logger.error(`Excepción enviando correo de contacto de ${email}:`, err);
      return false;
    }
  }

  /**
   * Envia un correo de recibo/comprobante de transacción aprobada o declinada.
   */
  async sendPaymentReceiptEmail(
    userEmail: string,
    userName: string,
    transactionData: {
      status: 'approved' | 'declined';
      amount?: string;
      currency?: string;
      approvalCode?: string;
      oid?: string;
      failReason?: string;
    }
  ) {
    try {
      const isApproved = transactionData.status === 'approved';
      const subject = isApproved 
        ? '✅ Comprobante de Donación Exitosa - AYNI'
        : '❌ Actualización sobre tu intento de Donación - AYNI';
      
      const titulo = isApproved ? '¡Donación Exitosa!' : 'Tu pago fue rechazado';
      const descripcion = isApproved 
        ? 'Queremos agradecerte por tu aporte. Tu donación ha sido procesada de forma segura y exitosa. A continuación te enviamos el comprobante de la transacción.'
        : 'Te informamos que hubo un problema al procesar tu pago. Tu banco procesador o Fiserv declinaron la transacción, por lo que <strong>no se ha realizado ningún débito</strong> en tu cuenta.';

      let detallesHtml = '';
      if (isApproved && transactionData.amount) {
        detallesHtml += `
          <div style="margin-bottom: 10px;">
            <strong>Monto:</strong> $${parseFloat(transactionData.amount).toLocaleString('es-AR')} ${transactionData.currency || 'ARS'}
          </div>`;
      }
      if (transactionData.approvalCode) {
        detallesHtml += `
          <div style="margin-bottom: 10px;">
            <strong>Código de Aprobación:</strong> ${transactionData.approvalCode}
          </div>`;
      }
      if (transactionData.oid) {
        detallesHtml += `
          <div style="margin-bottom: 10px;">
            <strong>Referencia (OID):</strong> <span style="font-size: 12px; color: #666;">${transactionData.oid}</span>
          </div>`;
      }
      if (!isApproved && transactionData.failReason) {
        detallesHtml += `
          <div style="margin-bottom: 10px;">
            <strong>Motivo reportado:</strong> ${transactionData.failReason}
          </div>`;
      }

      const { data, error } = await this.resend.emails.send({
        from: `${this.defaultSenderName} <${this.defaultSenderEmail}>`,
        to: [userEmail],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #40a8ab; padding: 30px; text-align: center;">
              <img src="https://res.cloudinary.com/dxbtafe9u/image/upload/q_auto/f_auto/v1775685229/ISOLOGOTIPO_AYNI_FONDO_TRANSPARENTE_iwyuaw.png" alt="AYNI Logo" style="height: 50px;" />
            </div>
            <div style="padding: 40px 30px;">
              <h1 style="color: #40a8ab; font-size: 24px; margin-bottom: 20px;">${titulo}</h1>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hola, <strong>${userName}</strong>:
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                ${descripcion}
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin-top: 0; color: #40a8ab; font-size: 14px; text-transform: uppercase;">Detalles de la operación</h3>
                ${detallesHtml}
              </div>

              ${isApproved 
                ? '<p style="font-size: 15px; color: #40a8ab; font-weight: bold; text-align: center;">¡Tus beneficios exclusivos en la red AYNI ya están activos!</p>' 
                : '<p style="font-size: 14px; color: #e11d48; text-align: center; font-weight: bold;">Por favor, verifica tus datos o intenta con otro medio de pago desde la plataforma.</p>'}
            </div>
            <div style="background-color: #f7f9fc; padding: 20px; text-align: center; color: #718096; font-size: 12px;">
              <p style="margin: 0;">AYNI - Plataforma Fintech de Reciprocidad</p>
            </div>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Error enviando recibo de pago a ${userEmail}:`, error);
        return false;
      }

      this.logger.log(`✅ Recibo de pago (${transactionData.status}) enviado a ${userEmail}. Job ID: ${data?.id}`);
      return true;
    } catch (err) {
      this.logger.error(`Excepción enviando recibo a ${userEmail}:`, err);
      return false;
    }
  }
}
