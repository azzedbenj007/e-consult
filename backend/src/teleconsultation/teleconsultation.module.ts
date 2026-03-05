import { Module } from '@nestjs/common';
import { TeleconsultationGateway } from './teleconsultation.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TeleconsultationGateway],
})
export class TeleconsultationModule {}
