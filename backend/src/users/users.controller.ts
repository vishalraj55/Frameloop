import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  // BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':username')
  getProfile(@Param('username') username: string) {
    return this.usersService.getProfile(username);
  }

  @Patch(':username')
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  async updateProfile(
    @Param('username') username: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { bio?: string; username?: string },
  ) {
    let avatarUrl: string | undefined;

    if (file) {
      avatarUrl = await new Promise<string>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (error, result) => {
            if (error || !result)
              return reject(new Error(error?.message ?? 'Upload failed'));
            resolve(result.secure_url);
          },
        );
        Readable.from(file.buffer).pipe(upload);
      });
    }

    return this.usersService.updateProfile(username, {
      bio: body.bio,
      avatarUrl,
      newUsername: body.username,
    });
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
