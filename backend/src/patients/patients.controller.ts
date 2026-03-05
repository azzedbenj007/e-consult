import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil patient' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.patientsService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Modifier mon profil patient' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.patientsService.updateProfile(userId, dto);
  }
}
