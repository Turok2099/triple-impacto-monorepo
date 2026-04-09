import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import { SubscribeDto } from './dtos/subscribe.dto';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly mailService: MailService,
  ) {}

  async subscribe(subscribeDto: SubscribeDto) {
    const { email } = subscribeDto;
    const client = this.supabaseService.getClient();

    try {
      // 1. Verificamos si ya existe el correo para no causar Duplicate Key Exception
      const { data: existingUser } = await client
        .from('newsletter_suscriptores')
        .select('id, activo')
        .eq('email', email)
        .single();

      if (existingUser) {
        if (!existingUser.activo) {
          // Si estaba borrado logicamente, lo reactivamos
          await client
            .from('newsletter_suscriptores')
            .update({ activo: true })
            .eq('id', existingUser.id);
          this.logger.log(`Reactivado suscriptor de newsletter: ${email}`);
          return { status: 'reactivado', message: '¡Qué bueno tenerte de vuelta en nuestra lista!' };
        }
        // Ya está activo
        return { status: 'existente', message: '¡Ya estás suscrito al Newsletter de AYNI!' };
      }

      // 2. Si no existe, lo insertamos
      const { error: insertError } = await client
        .from('newsletter_suscriptores')
        .insert({ email, activo: true });

      if (insertError) {
        this.logger.error('Error insertando en newsletter_suscriptores:', insertError);
        throw new Error('Error al registrar la suscripción.');
      }

      // 3. Enviamos correo de bienvenida
      await this.mailService.sendNewsletterWelcomeEmail(email);

      this.logger.log(`Nuevo suscriptor de newsletter registrado: ${email}`);
      return { status: 'exito', message: 'Suscripción exitosa. ¡Revisá tu bandeja de entrada!' };
    } catch (error) {
      this.logger.error('Excepción en suscripción de newsletter:', error);
      throw new Error('No se pudo procesar tu suscripción en este momento.');
    }
  }
}
