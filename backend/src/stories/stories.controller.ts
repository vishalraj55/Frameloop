import {
  Controller,
  Get,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { StoriesService } from './stories.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { AuthRequest } from '../auth/jwt-auth.guard';

@Controller('stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getAll(@Req() req: AuthRequest) {
    return this.storiesService.getActiveStories(req.user?.id);
  }

  @Get(':username')
  getByUsername(@Param('username') username: string) {
    return this.storiesService.getStoriesByUsername(username);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { authorId: string },
  ) {
    if (!file) throw new BadRequestException('Image is required');

    const isVideo = file.mimetype.startsWith('video/');

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `users/${body.authorId}/stories`,
          resource_type: isVideo ? 'video' : 'image',
          ...(isVideo ? {} : { format: 'jpg' }),
        },
        (error, result) => {
          if (error || !result)
            return reject(new Error(error?.message ?? 'Upload failed'));
          resolve(result.secure_url);
        },
      );
      Readable.from(file.buffer).pipe(upload);
    });

    return this.storiesService.createStory(imageUrl, body.authorId);
  }
}
