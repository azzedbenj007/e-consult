import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tableau de bord admin' })
  getDashboard() { return this.service.getDashboard(); }

  @Get('doctors/pending')
  @ApiOperation({ summary: 'Médecins en attente de validation' })
  getPendingDoctors() { return this.service.getPendingDoctors(); }

  @Patch('doctors/:id/verify')
  @ApiOperation({ summary: 'Valider un médecin' })
  verifyDoctor(@Param('id') id: string) { return this.service.verifyDoctor(id); }

  @Get('users')
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  getAllUsers(@Query('page') page: number, @Query('limit') limit: number) {
    return this.service.getAllUsers(page, limit);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Tous les paiements' })
  getAllPayments(@Query('page') page: number, @Query('limit') limit: number) {
    return this.service.getAllPayments(page, limit);
  }
}
