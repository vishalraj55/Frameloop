import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async getComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: { username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(postId: string, authorId: string, text: string) {
    return this.prisma.comment.create({
      data: { postId, authorId, text },
      include: {
        author: {
          select: { username: true, avatarUrl: true },
        },
      },
    });
  }

  async deleteComment(commentId: string) {
    return this.prisma.comment.delete({ where: { id: commentId } });
  }
}
