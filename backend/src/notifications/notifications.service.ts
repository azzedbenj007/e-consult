import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.sendgrid.net'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      auth: {
        user: this.configService.get('SMTP_USER', 'apikey'),
        pass: this.configService.get('SMTP_PASSWORD', ''),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM', 'noreply@e-consult.ma'),
        to, subject, html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
    }
  }

  async sendAppointmentConfirmation(email: string, appointmentDetails: any) {
    const html = `
      <h2>Rendez-vous confirmé</h2>
      <p>Votre rendez-vous avec Dr. ${appointmentDetails.doctorName} est confirmé.</p>
      <p><strong>Date :</strong> ${appointmentDetails.date}</p>
      <p><strong>Type :</strong> ${appointmentDetails.type}</p>
    `;
    return this.sendEmail(email, 'Confirmation de rendez-vous — E-Consult', html);
  }

  async sendAppointmentReminder(email: string, appointmentDetails: any) {
    const html = `
      <h2>Rappel de rendez-vous</h2>
      <p>Votre rendez-vous avec Dr. ${appointmentDetails.doctorName} est dans 1 heure.</p>
    `;
    return this.sendEmail(email, 'Rappel de rendez-vous — E-Consult', html);
  }
}
