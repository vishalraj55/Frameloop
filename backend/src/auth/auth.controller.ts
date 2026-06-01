import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('create-profile')
  createProfile(@Body() body: { id: string; username: string; email: string }) {
    return this.authService.createProfile(body);
  }
}
