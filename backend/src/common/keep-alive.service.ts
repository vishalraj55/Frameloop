import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  @Cron('*/10 * * * *')
  async ping() {
    try {
      await fetch('https://new-project-backend.onrender.com/');
      this.logger.log('Keep-alive ping sent');
    } catch (err) {
      this.logger.error('Keep-alive ping failed', err);
    }
  }
}
