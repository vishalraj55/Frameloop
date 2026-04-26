import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { PostsService } from './posts.service';
import { LikeDto } from './dto/like.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { Request } from 'express';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getFeed(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Req() req?: Request & { user?: { id: string } },
  ) {
    const viewerId = req?.user?.id;
    return this.postsService.getFeed(
      cursor,
      limit ? parseInt(limit, 10) : 10,
      viewerId,
    );
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { caption?: string; authorId: string },
  ) {
    if (!file) throw new BadRequestException('Image is required');

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: `users/${body.authorId}/posts` },
        (error, result) => {
          if (error || !result)
            return reject(new Error(error?.message ?? 'Upload failed'));
          resolve(result.secure_url);
        },
      );
      Readable.from(file.buffer).pipe(upload);
    });

    return this.postsService.createPost({
      imageUrl,
      caption: body.caption,
      authorId: body.authorId,
    });
  }

  @Post(':id/like')
  like(@Param('id') id: string, @Body() body: LikeDto) {
    return this.postsService.likePost(id, body.userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.postsService.delete(id);
  }
  @Get('user/:userId')
  getUserPosts(@Param('userId') userId: string) {
    return this.postsService.findByUser(userId);
  }
}
