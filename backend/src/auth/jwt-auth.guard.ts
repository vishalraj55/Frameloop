import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export interface AuthRequest extends Request {
  user: { id: string; username: string };
}
