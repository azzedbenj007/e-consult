import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!patient) throw new NotFoundException('Patient profile not found');
    return patient;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.patient.update({ where: { userId }, data });
  }
}
