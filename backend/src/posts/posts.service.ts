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

  async getFeed(cursor?: string, limit = 10, viewerId?: string) {
    const posts = await this.prisma.post.findMany({
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: {
        author: { select: authorSelect },
        likes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!viewerId) return posts;

    const authorIds = [...new Set(posts.map((p) => p.author.id))];

    const followings = await this.prisma.follow.findMany({
      where: {
        followerId: viewerId,
        followingId: { in: authorIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(followings.map((f) => f.followingId));

    return posts.map((post) => ({
      ...post,
      author: {
        ...post.author,
        isFollowing: followingSet.has(post.author.id),
      },
    }));
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
    const existing = await this.prisma.like.findFirst({
      where: { postId, userId },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      const count = await this.prisma.like.count({ where: { postId } });
      return { liked: false, count };
    }

    await this.prisma.like.create({ data: { postId, userId } });
    const count = await this.prisma.like.count({ where: { postId } });
    return { liked: true, count };
  }

  async delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
