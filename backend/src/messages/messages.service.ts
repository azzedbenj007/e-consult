import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // Group by conversation partner
    const conversationsMap = new Map<string, any>();
    messages.forEach((msg) => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner: msg.senderId === userId ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      if (msg.receiverId === userId && !msg.isRead) {
        conversationsMap.get(partnerId).unreadCount++;
      }
    });
    return Array.from(conversationsMap.values());
  }

  async getThread(userId: string, partnerId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    await this.prisma.message.updateMany({
      where: { senderId: partnerId, receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return messages;
  }

  async send(senderId: string, dto: { receiverId: string; content: string; appointmentId?: string }) {
    return this.prisma.message.create({
      data: { senderId, ...dto },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }
}
