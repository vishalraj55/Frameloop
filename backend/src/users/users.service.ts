import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });
  }

  async getProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        posts: {
          select: {
            id: true,
            imageUrl: true,
            caption: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    username: string,
    data: { bio?: string; avatarUrl?: string; newUsername?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { username },
      data: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
        ...(data.newUsername && { username: data.newUsername }),
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.delete({ where: { id } });
  }
}
