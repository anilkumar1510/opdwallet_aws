import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RelationshipMaster, RelationshipMasterDocument } from './schemas/relationship-master.schema';

@Injectable()
export class RelationshipsService {
  constructor(
    @InjectModel(RelationshipMaster.name)
    private relationshipMasterModel: Model<RelationshipMasterDocument>,
  ) {}

  async findAll() {
    return this.relationshipMasterModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select('-__v')
      .lean();
  }

  async findByCode(relationshipCode: string) {
    return this.relationshipMasterModel
      .findOne({ relationshipCode: relationshipCode.toUpperCase(), isActive: true })
      .lean();
  }

  async findByCodes(relationshipCodes: string[]) {
    const upperCaseCodes = relationshipCodes.map(code => code.toUpperCase());
    return this.relationshipMasterModel
      .find({
        relationshipCode: { $in: upperCaseCodes },
        isActive: true
      })
      .sort({ sortOrder: 1 })
      .lean();
  }

}