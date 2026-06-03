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
    if (!viewerId) {
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
      return posts;
    }

    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    const followingSet = new Set(followingIds);

    const followedPosts =
      followingIds.length > 0
        ? await this.prisma.post.findMany({
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            where: { authorId: { in: followingIds } },
            include: { author: { select: authorSelect }, likes: true },
            orderBy: { createdAt: 'desc' },
          })
        : [];

    const followedEnriched = followedPosts.map((p) => ({
      ...p,
      author: { ...p.author, isFollowing: true },
    }));

    if (followedEnriched.length >= limit) return followedEnriched;

    const remaining = limit - followedEnriched.length;

    const otherPosts = await this.prisma.post.findMany({
      take: remaining,
      where: {
        authorId: { notIn: [...followingIds, viewerId] },
        id: { notIn: followedPosts.map((p) => p.id) },
      },
      include: { author: { select: authorSelect }, likes: true },
      orderBy: { createdAt: 'desc' },
    });

    const otherEnriched = otherPosts.map((p) => ({
      ...p,
      author: { ...p.author, isFollowing: followingSet.has(p.author.id) },
    }));

    return [...followedEnriched, ...otherEnriched];
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

  async updateCaption(id: string, caption: string) {
    return this.prisma.post.update({
      where: { id },
      data: { caption },
    });
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

    // Notify post author
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (post && post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          type: 'like',
          senderId: userId,
          receiverId: post.authorId,
          postId,
        },
      });
    }

    const count = await this.prisma.like.count({ where: { postId } });
    return { liked: true, count };
  }

  async delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
  async findByUser(userId: string) {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        likes: true,
      },
    });
  }
}
