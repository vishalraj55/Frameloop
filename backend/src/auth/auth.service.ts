import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async createProfile(data: { id: string; username: string; email: string }) {
    try {
      const user = await this.prisma.user.create({
        data: {
          id: data.id,
          username: data.username,
          email: data.email,
        },
      });
      return user;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Username or email already taken');
      }
      throw error;
    }
  }
}
