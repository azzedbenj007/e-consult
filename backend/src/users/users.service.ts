import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: { include: { speciality: true } }, patient: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, refreshTokenHash, twoFactorSecret, ...safe } = user;
    return safe;
  }

  async updateMe(userId: string, data: any) {
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 12);
      delete data.password;
    }
    const { passwordHash, refreshTokenHash, twoFactorSecret, ...safe } = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return safe;
  }

  async deleteMe(userId: string) {
    // GDPR: Anonymize instead of hard delete
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.invalid`,
        firstName: 'Supprimé',
        lastName: 'Supprimé',
        phone: null,
        isActive: false,
        refreshTokenHash: null,
      },
    });
    return { message: 'Account deleted successfully' };
  }
}
