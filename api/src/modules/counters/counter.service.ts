import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async getNextSequence(counterName: string): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: counterName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return counter.seq;
  }

  async generateUserId(): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await this.getNextSequence('user');
    return `USR-${year}-${String(seq).padStart(4, '0')}`;
  }

  async generatePolicyNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await this.getNextSequence('policy');
    return `POL-${year}-${String(seq).padStart(4, '0')}`;
  }
}