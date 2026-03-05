import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Créer un rendez-vous' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes rendez-vous' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Query() query: AppointmentQueryDto,
  ) {
    return this.appointmentsService.findAll(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un rendez-vous' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.appointmentsService.findOne(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un rendez-vous' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, userId, role, dto);
  }

  @Get(':id/join')
  @ApiOperation({ summary: 'Obtenir le token pour rejoindre la salle vidéo' })
  joinRoom(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.appointmentsService.getJoinToken(id, userId, role);
  }
}
