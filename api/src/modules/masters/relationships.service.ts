import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RelationshipMaster, RelationshipMasterDocument } from './schemas/relationship-master.schema';
import { CreateRelationshipMasterDto, UpdateRelationshipMasterDto } from './dto/relationship-master.dto';

@Injectable()
export class RelationshipsService {
  constructor(
    @InjectModel(RelationshipMaster.name)
    private relationshipMasterModel: Model<RelationshipMasterDocument>,
  ) {}

  async findAll() {
    return this.relationshipMasterModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, relationshipCode: 1 })
      .select('-__v')
      .lean();
  }

  async findAllIncludingInactive() {
    return this.relationshipMasterModel
      .find()
      .sort({ sortOrder: 1, relationshipCode: 1 })
      .select('-__v')
      .lean();
  }

  async findById(id: string) {
    const relationship = await this.relationshipMasterModel
      .findById(id)
      .select('-__v')
      .lean();

    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${id} not found`);
    }

    return relationship;
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
      .sort({ sortOrder: 1, relationshipCode: 1 })
      .lean();
  }

  async create(createDto: CreateRelationshipMasterDto, userId?: string) {
    // Check if relationship code already exists
    const existing = await this.relationshipMasterModel
      .findOne({ relationshipCode: createDto.relationshipCode.toUpperCase() })
      .lean();

    if (existing) {
      throw new ConflictException(`Relationship with code ${createDto.relationshipCode} already exists`);
    }

    const relationship = new this.relationshipMasterModel({
      ...createDto,
      relationshipCode: createDto.relationshipCode.toUpperCase(),
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await relationship.save();
    return saved.toObject();
  }

  async update(id: string, updateDto: UpdateRelationshipMasterDto, userId?: string) {
    const relationship = await this.relationshipMasterModel.findById(id);

    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${id} not found`);
    }

    Object.assign(relationship, updateDto);
    relationship.updatedBy = userId;

    const updated = await relationship.save();
    return updated.toObject();
  }

  async delete(id: string) {
    const relationship = await this.relationshipMasterModel.findById(id);

    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${id} not found`);
    }

    await this.relationshipMasterModel.findByIdAndDelete(id);
    return { message: 'Relationship deleted successfully' };
  }

  async toggleActive(id: string, userId?: string) {
    const relationship = await this.relationshipMasterModel.findById(id);

    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${id} not found`);
    }

    relationship.isActive = !relationship.isActive;
    relationship.updatedBy = userId;

    const updated = await relationship.save();
    return updated.toObject();
  }
}