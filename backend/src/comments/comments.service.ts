import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const authorSelect = {
  select: { id: true, username: true, avatarUrl: true },
};

const commentInclude = {
  author: authorSelect,
  likes: { select: { userId: true } },
};

type RawComment = {
  id: string;
  text: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
  createdAt: Date;
  isDeleted?: boolean;
  author: { id: string; username: string; avatarUrl: string | null };
  likes: { userId: string }[];
};

const formatComment = (comment: RawComment, requestingUserId?: string) => ({
  id: comment.id,
  text: comment.text,
  postId: comment.postId,
  authorId: comment.authorId,
  parentId: comment.parentId,
  createdAt: comment.createdAt,
  isDeleted: comment.isDeleted ?? false,
  author: comment.author,
  likesCount: comment.likes.length,
  likedByMe: requestingUserId
    ? comment.likes.some((l) => l.userId === requestingUserId)
    : false,
});

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async getComments(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => formatComment(c));
  }

  async addComment(
    postId: string,
    authorId: string,
    text: string,
    parentId?: string,
  ) {
    const comment = await this.prisma.comment.create({
      data: { postId, authorId, text, ...(parentId && { parentId }) },
      include: commentInclude,
    });

    return formatComment(comment);
  }

  async handleAction(
    commentId: string,
    action: string,
    body: { text?: string; userId?: string; reason?: string },
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    switch (action) {
      case 'edit': {
        if (comment.authorId !== body.userId)
          throw new ForbiddenException('Not your comment');

        const updated = await this.prisma.comment.update({
          where: { id: commentId },
          data: { text: body.text },
          include: commentInclude,
        });
        return formatComment(updated, body.userId);
      }

      case 'like': {
        const existing = await this.prisma.commentLike.findUnique({
          where: { commentId_userId: { commentId, userId: body.userId! } },
        });

        if (existing) {
          await this.prisma.commentLike.delete({
            where: { commentId_userId: { commentId, userId: body.userId! } },
          });
        } else {
          await this.prisma.commentLike.create({
            data: { commentId, userId: body.userId! },
          });
        }

        const updated = await this.prisma.comment.findUnique({
          where: { id: commentId },
          include: commentInclude,
        });

        if (!updated) throw new NotFoundException('Comment not found');
        return formatComment(updated, body.userId);
      }

      case 'report': {
        await this.prisma.commentReport.create({
          data: {
            commentId,
            userId: body.userId!,
            reason: body.reason ?? 'No reason provided',
          },
        });
        return { success: true };
      }

      default:
        throw new NotFoundException(`Unknown action: ${action}`);
    }
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId)
      throw new ForbiddenException('Not your comment');

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }
}
