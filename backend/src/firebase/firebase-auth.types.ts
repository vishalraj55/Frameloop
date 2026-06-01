import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    uid: string;
    email?: string;
    [key: string]: unknown;
  };
}
