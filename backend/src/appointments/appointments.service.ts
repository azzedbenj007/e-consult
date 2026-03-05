import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(patientUserId: string, dto: CreateAppointmentDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: patientUserId },
    });
    if (!patient) throw new ForbiddenException('Only patients can book appointments');

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });
    if (!doctor || !doctor.isVerified) {
      throw new NotFoundException('Doctor not found or not verified');
    }

    const scheduledAt = new Date(dto.scheduledAt);

    // Check slot availability
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - 30 * 60 * 1000),
          lt: new Date(scheduledAt.getTime() + 30 * 60 * 1000),
        },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
    });

    if (conflict) throw new ConflictException('This time slot is not available');

    const roomId = `room_${uuidv4()}`;

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: dto.doctorId,
        specialityId: dto.specialityId,
        scheduledAt,
        type: dto.type,
        chiefComplaint: dto.chiefComplaint,
        roomId,
        amount: doctor.consultationFee,
      },
      include: {
        doctor: { include: { user: true, speciality: true } },
        patient: { include: { user: true } },
        speciality: true,
      },
    });

    return appointment;
  }

  async findAll(userId: string, role: UserRole, query: AppointmentQueryDto) {
    const { status, from, to, page = 1, limit = 10 } = query;

    let whereClause: any = {};

    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (!patient) return { data: [], meta: { total: 0, page, limit } };
      whereClause.patientId = patient.id;
    } else if (role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return { data: [], meta: { total: 0, page, limit } };
      whereClause.doctorId = doctor.id;
    }

    if (status) whereClause.status = status;
    if (from || to) {
      whereClause.scheduledAt = {};
      if (from) whereClause.scheduledAt.gte = new Date(from);
      if (to) whereClause.scheduledAt.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: whereClause,
        include: {
          doctor: { include: { user: true, speciality: true } },
          patient: { include: { user: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where: whereClause }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true, speciality: true } },
        patient: { include: { user: true } },
        medicalRecord: true,
        prescription: true,
        payment: true,
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    // Authorization check
    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (appointment.patientId !== patient?.id) throw new ForbiddenException();
    } else if (role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (appointment.doctorId !== doctor?.id) throw new ForbiddenException();
    }

    return appointment;
  }

  async update(id: string, userId: string, role: UserRole, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(id, userId, role);

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot modify a completed or cancelled appointment');
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === AppointmentStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = userId;
        updateData.cancellationReason = dto.cancellationReason;
      }
      if (dto.status === AppointmentStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }

    if (dto.notes) updateData.notes = dto.notes;

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        doctor: { include: { user: true, speciality: true } },
        patient: { include: { user: true } },
      },
    });
  }

  async getJoinToken(appointmentId: string, userId: string, role: UserRole) {
    const appointment = await this.findOne(appointmentId, userId, role);

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Appointment must be confirmed to join');
    }

    if (!appointment.roomId) throw new BadRequestException('No room assigned');

    const now = new Date();
    const scheduledAt = new Date(appointment.scheduledAt);
    const diffMinutes = (scheduledAt.getTime() - now.getTime()) / (1000 * 60);

    if (diffMinutes > 10) {
      throw new BadRequestException('You can only join within 10 minutes of the appointment');
    }

    return {
      roomId: appointment.roomId,
      appointmentId,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
    };
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const availability = await this.prisma.availability.findFirst({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (!availability) return [];

    // Get existing appointments for that day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
      select: { scheduledAt: true },
    });

    const bookedTimes = new Set(
      bookedAppointments.map((a) => a.scheduledAt.toISOString()),
    );

    // Generate slots
    const slots: string[] = [];
    const [startHour, startMin] = availability.startTime.split(':').map(Number);
    const [endHour, endMin] = availability.endTime.split(':').map(Number);

    const start = new Date(targetDate);
    start.setHours(startHour, startMin, 0, 0);
    const end = new Date(targetDate);
    end.setHours(endHour, endMin, 0, 0);

    while (start < end) {
      if (!bookedTimes.has(start.toISOString())) {
        slots.push(start.toISOString());
      }
      start.setMinutes(start.getMinutes() + availability.slotMinutes);
    }

    return slots;
  }
}
