import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ServicesModule } from './modules/services/services.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PlanVersionsModule } from './modules/plan-versions/plan-versions.module';
import { BenefitComponentsModule } from './modules/benefit-components/benefit-components.module';
import { WalletRulesModule } from './modules/wallet-rules/wallet-rules.module';
import { BenefitCoverageMatrixModule } from './modules/benefit-coverage-matrix/benefit-coverage-matrix.module';
import { PlanConfigResolverModule } from './modules/plan-config-resolver/plan-config-resolver.module';
import { HealthModule } from './health/health.module';
import { MastersModule } from './modules/masters/masters.module';
import { BenefitsModule } from './modules/benefits/benefits.module';
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
      limit: 10000,
    }]),
    HealthModule,
    AuthModule,
    UsersModule,
    PoliciesModule,
    AssignmentsModule,
    ServicesModule,
    CategoriesModule,
    PlanVersionsModule,
    BenefitComponentsModule,
    WalletRulesModule,
    BenefitCoverageMatrixModule,
    PlanConfigResolverModule,
    MastersModule,
    BenefitsModule,
  ],
})
export class AppModule {}