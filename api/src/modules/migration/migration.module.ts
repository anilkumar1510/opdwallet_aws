import { Module } from '@nestjs/common';
import { MigrationController } from './migration.controller';
import { PlanConfigModule } from '../plan-config/plan-config.module';

@Module({
  imports: [PlanConfigModule],
  controllers: [MigrationController],
})
export class MigrationModule {}