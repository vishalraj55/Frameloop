import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
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
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { caption?: string; authorId: string },
  ) {
    if (!file) throw new BadRequestException('Image is required');

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'posts' },
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
}
