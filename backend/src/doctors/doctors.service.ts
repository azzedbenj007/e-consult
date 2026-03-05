import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { specialityId?: string; search?: string; page?: number; limit?: number }) {
    const { specialityId, search, page = 1, limit = 10 } = query;
    const where: any = { isVerified: true };
    if (specialityId) where.specialityId = specialityId;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } }, speciality: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.doctor.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true, phone: true } }, speciality: true, availabilities: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async getProfile(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: { user: true, speciality: true, availabilities: true },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return doctor;
  }

  async updateProfile(userId: string, data: any) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new ForbiddenException('Doctor profile not found');
    return this.prisma.doctor.update({ where: { userId }, data });
  }

  async createDoctorProfile(userId: string, dto: any) {
    return this.prisma.doctor.create({
      data: { userId, ...dto },
      include: { user: true, speciality: true },
    });
  }

  async setAvailability(userId: string, slots: any[]) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new ForbiddenException();
    await this.prisma.availability.deleteMany({ where: { doctorId: doctor.id } });
    return this.prisma.availability.createMany({
      data: slots.map((s) => ({ ...s, doctorId: doctor.id })),
    });
  }
}
