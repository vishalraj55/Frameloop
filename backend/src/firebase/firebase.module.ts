import { Module, Global } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';

@Global()
@Module({
  providers: [
    FirebaseAdminService,
    FirebaseAuthGuard,
    OptionalFirebaseAuthGuard,
  ],
  exports: [FirebaseAdminService, FirebaseAuthGuard, OptionalFirebaseAuthGuard],
})
export class FirebaseModule {}
