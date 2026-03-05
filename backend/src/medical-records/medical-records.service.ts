import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorUserId: string, dto: any) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
    if (!doctor) throw new ForbiddenException('Only doctors can create medical records');
    return this.prisma.medicalRecord.create({ data: { ...dto, doctorId: doctor.id } });
  }

  async findAll(userId: string, role: UserRole) {
    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (!patient) return [];
      return this.prisma.medicalRecord.findMany({
        where: { patientId: patient.id },
        include: { doctor: { include: { user: true, speciality: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return [];
      return this.prisma.medicalRecord.findMany({
        where: { doctorId: doctor.id },
        include: { patient: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return [];
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, speciality: true } },
        appointment: true,
      },
    });
    if (!record) throw new NotFoundException('Medical record not found');
    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (record.patientId !== patient?.id) throw new ForbiddenException();
    } else if (role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (record.doctorId !== doctor?.id) throw new ForbiddenException();
    }
    // Log access
    await this.prisma.recordAccessLog.create({
      data: { recordId: id, accessedBy: userId, accessType: 'READ' },
    });
    return record;
  }

  async update(id: string, doctorUserId: string, data: any) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
    const record = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException();
    if (record.doctorId !== doctor?.id) throw new ForbiddenException();
    return this.prisma.medicalRecord.update({ where: { id }, data });
  }
}
