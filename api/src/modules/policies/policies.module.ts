import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { Policy, PolicySchema } from './schemas/policy.schema';
import { CounterModule } from '../counters/counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Policy.name, schema: PolicySchema }]),
    CounterModule,
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}