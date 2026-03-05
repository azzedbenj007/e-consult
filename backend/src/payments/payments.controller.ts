import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent/:appointmentId')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Créer un PaymentIntent Stripe' })
  createIntent(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createPaymentIntent(appointmentId, userId);
  }

  @Post('confirm')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Confirmer un paiement' })
  confirm(@Body('paymentIntentId') paymentIntentId: string) {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des paiements' })
  history(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.paymentsService.getPaymentHistory(userId, role);
  }

  @Post('refund/:paymentId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rembourser un paiement (admin)' })
  refund(
    @Param('paymentId') paymentId: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.paymentsService.refund(paymentId, adminUserId);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook Stripe' })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody!, signature);
  }
}
