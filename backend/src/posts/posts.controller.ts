import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import { PostsService } from './posts.service';
import { LikeDto } from './dto/like.dto';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  getFeed() {
    return this.postsService.getFeed();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (
          _req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { caption?: string; authorId: string },
  ) {
    return this.postsService.createPost({
      imageUrl: `/uploads/${file.filename}`,
      caption: body.caption,
      authorId: body.authorId,
    });
  }

  @Post(':id/like')
  like(@Param('id') id: string, @Body() body: LikeDto) {
    return this.postsService.likePost(id, body.userId);
  }
}