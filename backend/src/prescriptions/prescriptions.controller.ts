import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PrescriptionsService, CreatePrescriptionDto } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Créer une ordonnance' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.prescriptionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes ordonnances' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.prescriptionsService.findAll(userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une ordonnance' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.prescriptionsService.findOne(id, userId, role);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharger l\'ordonnance en PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.prescriptionsService.generatePdf(id, userId, role);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ordonnance-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
