import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
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
    @Body() body: { authorId: string; text: string },
  ) {
    return this.commentsService.addComment(postId, body.authorId, body.text);
  }

  @Delete(':commentId')
  deleteComment(@Param('commentId') commentId: string) {
    return this.commentsService.deleteComment(commentId);
  }
}
