import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';

@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  constructor(private firebaseAdmin: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const headers = request.headers as Record<string, string>;
    const authHeader = headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decoded = await this.firebaseAdmin.verifyToken(token);
      request.user = { id: decoded.uid };
    } catch {
      request.user = null;
    }

    return true;
  }
}
