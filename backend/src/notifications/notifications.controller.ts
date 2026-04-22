import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Req() req: AuthRequest) {
    return this.notificationsService.getNotifications(req.user.id);
  }

  @Patch()
  markAllRead(@Req() req: AuthRequest) {
    return this.notificationsService.markAllRead(req.user.id);
  }
}
