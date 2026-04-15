import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  getComments(@Param('postId') postId: string) {
    return this.commentsService.getComments(postId);
  }

  @Post()
  addComment(
    @Param('postId') postId: string,
    @Body() body: { authorId: string; text: string; parentId?: string },
  ) {
    return this.commentsService.addComment(
      postId,
      body.authorId,
      body.text,
      body.parentId,
    );
  }

  @Patch(':commentId/:action')
  handleAction(
    @Param('commentId') commentId: string,
    @Param('action') action: 'edit' | 'like' | 'dislike' | 'pin' | 'report',
    @Body() body: { text?: string; userId?: string; reason?: string },
  ) {
    return this.commentsService.handleAction(commentId, action, body);
  }

  @Delete(':commentId')
  deleteComment(
    @Param('commentId') commentId: string,
    @Body() body: { userId: string },
  ) {
    return this.commentsService.deleteComment(commentId, body.userId);
  }
}
