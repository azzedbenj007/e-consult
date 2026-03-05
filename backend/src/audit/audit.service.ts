import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: { userId?: string; action: string; resource: string; resourceId?: string; ipAddress?: string; userAgent?: string; metadata?: any }) {
    return this.prisma.auditLog.create({ data });
  }

  async getLogs(filters: any) {
    return this.prisma.auditLog.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
