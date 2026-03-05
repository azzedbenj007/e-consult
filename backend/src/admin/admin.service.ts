import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [totalUsers, totalDoctors, totalPatients, totalAppointments, totalRevenue, pendingDoctors] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.doctor.count(),
      this.prisma.patient.count(),
      this.prisma.appointment.count(),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.PAID } }),
      this.prisma.doctor.count({ where: { isVerified: false } }),
    ]);
    return { totalUsers, totalDoctors, totalPatients, totalAppointments, totalRevenue: totalRevenue._sum.amount ?? 0, pendingDoctors };
  }

  async getPendingDoctors() {
    return this.prisma.doctor.findMany({
      where: { isVerified: false },
      include: { user: true, speciality: true },
    });
  }

  async verifyDoctor(doctorId: string) {
    return this.prisma.doctor.update({ where: { id: doctorId }, data: { isVerified: true } });
  }

  async getAllUsers(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count(),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getAllPayments(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ include: { patient: { include: { user: true } }, doctor: { include: { user: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.payment.count(),
    ]);
    return { data, meta: { total, page, limit } };
  }
}
