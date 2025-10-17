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

  async generateDoctorId(): Promise<string> {
    const seq = await this.getNextSequence('doctor');
    return `DOC${seq + 10000}`; // Start from DOC10001
  }

  async generateAppointmentId(): Promise<string> {
    const seq = await this.getNextSequence('appointment');
    return `APT${String(seq).padStart(6, '0')}`;
  }

  async generateSlotId(): Promise<string> {
    const seq = await this.getNextSequence('doctor-slot');
    return `SLOT${String(seq).padStart(6, '0')}`;
  }

  async generateClinicId(): Promise<string> {
    const seq = await this.getNextSequence('clinic');
    return `CLN${String(seq).padStart(5, '0')}`;
  }

  async generateTransactionId(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = await this.getNextSequence('transaction');
    return `TXN-${year}${month}${day}-${String(seq).padStart(4, '0')}`;
  }

  async generatePaymentId(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = await this.getNextSequence('payment');
    return `PAY-${year}${month}${day}-${String(seq).padStart(4, '0')}`;
  }
}