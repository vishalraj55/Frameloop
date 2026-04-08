import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() }), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
