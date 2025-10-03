import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { HealthModule } from './health/health.module';
import { MastersModule } from './modules/masters/masters.module';
import { AuditModule } from './modules/audit/audit.module';
import { PlanConfigModule } from './modules/plan-config/plan-config.module';
import { MemberModule } from './modules/member/member.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MigrationModule } from './modules/migration/migration.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { DoctorSlotsModule } from './modules/doctor-slots/doctor-slots.module';
import { MemberClaimsModule } from './modules/memberclaims/memberclaims.module';
import { TpaModule } from './modules/tpa/tpa.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 50000, // Increased by 500% for admin portal to prevent 429 errors
    }]),
    HealthModule,
    AuthModule,
    UsersModule,
    PoliciesModule,
    AssignmentsModule,
    MastersModule,
    AuditModule,
    PlanConfigModule,
    MemberModule,
    WalletModule,
    MigrationModule,
    SpecialtiesModule,
    DoctorsModule,
    AppointmentsModule,
    ClinicsModule,
    DoctorSlotsModule,
    MemberClaimsModule,
    TpaModule,
  ],
})
export class AppModule {}