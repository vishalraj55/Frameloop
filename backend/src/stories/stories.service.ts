import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  getActiveStories(currentUserId?: string) {
    return this.prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
        ...(currentUserId
          ? {
              OR: [
                { authorId: currentUserId },
                {
                  author: {
                    followers: {
                      some: { followerId: currentUserId },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        author: {
          select: { username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getStoriesByUsername(username: string) {
    return this.prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
        author: { username },
      },
      include: {
        author: {
          select: { username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  createStory(imageUrl: string, authorId: string) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.story.create({
      data: { imageUrl, authorId, expiresAt },
    });
  }
}
