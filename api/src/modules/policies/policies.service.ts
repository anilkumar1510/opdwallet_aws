import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Policy, PolicyDocument } from './schemas/policy.schema';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { QueryPolicyDto } from './dto/query-policy.dto';
import { CounterService } from '../counters/counter.service';
import { PolicyStatus } from '@/common/constants/status.enum';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    private counterService: CounterService,
  ) {}

  async create(createPolicyDto: CreatePolicyDto, createdBy: string) {
    const policyNumber = await this.counterService.generatePolicyNumber();

    const policy = new this.policyModel({
      ...createPolicyDto,
      policyNumber,
      status: createPolicyDto.status || PolicyStatus.DRAFT,
      createdBy,
    });

    return policy.save();
  }

  async findAll(query: QueryPolicyDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { policyNumber: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } },
      ];
    }

    const [policies, total] = await Promise.all([
      this.policyModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.policyModel.countDocuments(filter),
    ]);

    return {
      data: policies,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const policy = await this.policyModel.findById(id);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }
    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto, updatedBy: string) {
    const policy = await this.policyModel.findByIdAndUpdate(
      id,
      {
        ...updatePolicyDto,
        updatedBy,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }
}