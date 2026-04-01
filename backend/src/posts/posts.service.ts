import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed() {
    return this.prisma.post.findMany({
      include: {
        author: { select: authorSelect },
        likes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: authorSelect },
        likes: true,
      },
    });
  }

  async createPost(data: {
    imageUrl: string;
    caption?: string;
    authorId: string;
  }) {
    return this.prisma.post.create({ data });
  }

  async likePost(postId: string, userId: string) {
    return this.prisma.like.create({
      data: { postId, userId },
    });
  }

  async delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
