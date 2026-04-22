import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string) {
    return await this.prisma.notification.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sender: { select: { username: true, avatarUrl: true } },
      },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { receiverId: userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
