import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
        views: { select: { viewerId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getStoriesByUsername(username: string, currentUserId?: string) {
    return this.prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
        author: { username },
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        views: {
          select: {
            viewerId: true,
            createdAt: true,
            viewer: { select: { username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async recordView(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });
    if (!story) throw new NotFoundException('Story not found');

    if (story.authorId === viewerId) return { success: true };

    await this.prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      create: { storyId, viewerId },
      update: {},
    });

    return { success: true };
  }

  async getViews(storyId: string, requestingUserId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== requestingUserId)
      throw new ForbiddenException('Only the author can see views');

    return this.prisma.storyView.findMany({
      where: { storyId },
      include: {
        viewer: { select: { username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
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
