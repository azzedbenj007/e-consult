import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des médecins vérifiés' })
  findAll(@Query() query: any) {
    return this.doctorsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Profil d\'un médecin' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @ApiBearerAuth()
  @Get('me/profile')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Mon profil médecin' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.doctorsService.getProfile(userId);
  }

  @ApiBearerAuth()
  @Post('me/profile')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Créer profil médecin' })
  createProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.doctorsService.createDoctorProfile(userId, dto);
  }

  @ApiBearerAuth()
  @Patch('me/profile')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Modifier profil médecin' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.doctorsService.updateProfile(userId, dto);
  }

  @ApiBearerAuth()
  @Post('me/availability')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Définir les disponibilités' })
  setAvailability(@CurrentUser('id') userId: string, @Body() body: { slots: any[] }) {
    return this.doctorsService.setAvailability(userId, body.slots);
  }
}
