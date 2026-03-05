import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow('STRIPE_SECRET_KEY'),
      { apiVersion: '2023-10-16' },
    );
  }

  async createPaymentIntent(appointmentId: string, patientUserId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.patient.userId !== patientUserId) throw new ForbiddenException();
    if (appointment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Appointment already paid');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(appointment.amount) * 100), // centimes
      currency: 'mad',
      metadata: { appointmentId, patientUserId },
    });

    // Upsert payment record
    await this.prisma.payment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        amount: appointment.amount,
        currency: 'MAD',
        stripePaymentIntentId: paymentIntent.id,
      },
      update: { stripePaymentIntentId: paymentIntent.id },
    });

    return { clientSecret: paymentIntent.client_secret, amount: appointment.amount };
  }

  async confirmPayment(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment not completed');
    }

    const appointmentId = paymentIntent.metadata.appointmentId;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status: PaymentStatus.PAID,
          stripeChargeId: paymentIntent.latest_charge as string,
        },
      }),
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: AppointmentStatus.CONFIRMED,
        },
      }),
    ]);

    return { message: 'Payment confirmed, appointment confirmed' };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.getOrThrow('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.confirmPayment((event.data.object as Stripe.PaymentIntent).id);
        break;
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: failedIntent.id },
          data: { status: PaymentStatus.FAILED },
        });
        break;
    }

    return { received: true };
  }

  async refund(paymentId: string, adminUserId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { appointment: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Payment cannot be refunded');
    }
    if (!payment.stripeChargeId) throw new BadRequestException('No charge to refund');

    const refund = await this.stripe.refunds.create({
      charge: payment.stripeChargeId,
    });

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundAmount: payment.amount,
          refundedAt: new Date(),
        },
      }),
      this.prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: AppointmentStatus.CANCELLED,
        },
      }),
    ]);

    return { refundId: refund.id, message: 'Refund processed successfully' };
  }

  async getPaymentHistory(userId: string, role: string) {
    if (role === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (!patient) return [];
      return this.prisma.payment.findMany({
        where: { patientId: patient.id },
        include: { appointment: { include: { doctor: { include: { user: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return [];
      return this.prisma.payment.findMany({
        where: { doctorId: doctor.id },
        include: { appointment: { include: { patient: { include: { user: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
