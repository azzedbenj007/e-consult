import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SpecialitiesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.speciality.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  create(data: any) {
    return this.prisma.speciality.create({ data });
  }
}
