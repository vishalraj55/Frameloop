// import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL as string;
    const adapter = new PrismaPg({ connectionString });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.client = new PrismaClient({ adapter } as any);
  }

  get user() {
    return this.client.user;
  }
  get follow() {
    return this.client.follow;
  }
  get post() {
    return this.client.post;
  }
  get notification() {
    return this.client.notification;
  }
  get like() {
    return this.client.like;
  }
  get comment() {
    return this.client.comment;
  }
  get commentLike() {
    return this.client.commentLike;
  }
  get commentReport() {
    return this.client.commentReport;
  }
  get story() {
    return this.client.story;
  }
  get storyView() {
    return this.client.storyView;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
