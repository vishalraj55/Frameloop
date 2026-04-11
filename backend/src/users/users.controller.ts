import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { AuthRequest } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  getProfile(@Param('username') username: string, @Req() req: AuthRequest) {
    return this.usersService.getProfile(username, req.user?.id);
  }

  @Get(':username/followers')
  getFollowers(@Param('username') username: string) {
    return this.usersService.getFollowers(username);
  }

  @Get(':username/following')
  getFollowing(@Param('username') username: string) {
    return this.usersService.getFollowing(username);
  }

  @Patch(':username')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  async updateProfile(
    @Param('username') username: string,
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: { bio?: string; username?: string },
  ) {
    if (!req.user || req.user.username !== username) {
      throw new ForbiddenException("Cannot edit another user's profile");
    }

    let avatarUrl: string | undefined;

    if (file) {
      avatarUrl = await new Promise<string>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (error, result) => {
            if (error || !result) {
              return reject(new Error(error?.message ?? 'Upload failed'));
            }
            resolve(result.secure_url);
          },
        );

        Readable.from(file.buffer).pipe(upload);
      });
    }

    return this.usersService.updateProfile(username, {
      bio: body?.bio,
      avatarUrl,
      newUsername: body?.username,
    });
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  follow(@Param('username') username: string, @Req() req: AuthRequest) {
    if (!req.user) {
      throw new ForbiddenException();
    }

    return this.usersService.followUser(username, req.user.id);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('username') username: string, @Req() req: AuthRequest) {
    if (!req.user) {
      throw new ForbiddenException();
    }

    return this.usersService.unfollowUser(username, req.user.id);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
