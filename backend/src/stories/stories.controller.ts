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
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import type { AuthRequest } from '../auth/jwt-auth.guard';

@Controller('stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Get()
  @UseGuards(OptionalFirebaseAuthGuard)
  getAll(@Req() req: AuthRequest) {
    return this.storiesService.getActiveStories(req.user?.id);
  }

  @Get(':username')
  @UseGuards(OptionalFirebaseAuthGuard)
  getByUsername(@Param('username') username: string) {
    return this.storiesService.getStoriesByUsername(username);
  }

  @Post(':id/view')
  @UseGuards(FirebaseAuthGuard)
  recordView(@Param('id') storyId: string, @Req() req: AuthRequest) {
    return this.storiesService.recordView(storyId, req.user.id);
  }

  @Get(':id/views')
  @UseGuards(FirebaseAuthGuard)
  getViews(@Param('id') storyId: string, @Req() req: AuthRequest) {
    return this.storiesService.getViews(storyId, req.user.id);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    if (!file) throw new BadRequestException('Image is required');

    const isVideo = file.mimetype.startsWith('video/');

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `users/${req.user.id}/stories`,
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

    return this.storiesService.createStory(imageUrl, req.user.id);
  }
}
