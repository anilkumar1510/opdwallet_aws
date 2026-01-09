import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AhcPackage } from '../schemas/ahc-package.schema';
import { CreateAhcPackageDto, UpdateAhcPackageDto } from '../dto/create-ahc-package.dto';

@Injectable()
export class AhcPackageService {
  constructor(
    @InjectModel(AhcPackage.name)
    private ahcPackageModel: Model<AhcPackage>,
  ) {}

  async createPackage(createDto: CreateAhcPackageDto): Promise<AhcPackage> {
    // Validation: At least one service must be selected
    if ((!createDto.labServiceIds || createDto.labServiceIds.length === 0) &&
        (!createDto.diagnosticServiceIds || createDto.diagnosticServiceIds.length === 0)) {
      throw new BadRequestException('At least one lab test or diagnostic test must be selected');
    }

    // Validation: effectiveTo must be after effectiveFrom
    const fromDate = new Date(createDto.effectiveFrom);
    const toDate = new Date(createDto.effectiveTo);
    if (toDate <= fromDate) {
      throw new BadRequestException('Effective To date must be after Effective From date');
    }

    // Generate unique packageId: AHC-PKG-{timestamp}-{random}
    const packageId = `AHC-PKG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const ahcPackage = new this.ahcPackageModel({
      packageId,
      name: createDto.name,
      effectiveFrom: fromDate,
      effectiveTo: toDate,
      labServiceIds: createDto.labServiceIds || [],
      diagnosticServiceIds: createDto.diagnosticServiceIds || [],
      isActive: true,
    });

    return ahcPackage.save();
  }

  async getAllPackages(): Promise<AhcPackage[]> {
    return this.ahcPackageModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPackageById(packageId: string): Promise<AhcPackage> {
    const ahcPackage = await this.ahcPackageModel.findOne({ packageId });

    if (!ahcPackage) {
      throw new NotFoundException(`AHC Package ${packageId} not found`);
    }

    return ahcPackage;
  }

  async updatePackage(
    packageId: string,
    updateDto: UpdateAhcPackageDto,
  ): Promise<AhcPackage> {
    const ahcPackage = await this.getPackageById(packageId);

    // Validation: At least one service must be selected
    const labServices = updateDto.labServiceIds !== undefined ? updateDto.labServiceIds : ahcPackage.labServiceIds;
    const diagnosticServices = updateDto.diagnosticServiceIds !== undefined ? updateDto.diagnosticServiceIds : ahcPackage.diagnosticServiceIds;

    if (labServices.length === 0 && diagnosticServices.length === 0) {
      throw new BadRequestException('At least one lab test or diagnostic test must be selected');
    }

    // Validation: Date range if dates are being updated
    if (updateDto.effectiveFrom || updateDto.effectiveTo) {
      const fromDate = updateDto.effectiveFrom ? new Date(updateDto.effectiveFrom) : ahcPackage.effectiveFrom;
      const toDate = updateDto.effectiveTo ? new Date(updateDto.effectiveTo) : ahcPackage.effectiveTo;

      if (toDate <= fromDate) {
        throw new BadRequestException('Effective To date must be after Effective From date');
      }

      if (updateDto.effectiveFrom) ahcPackage.effectiveFrom = fromDate;
      if (updateDto.effectiveTo) ahcPackage.effectiveTo = toDate;
    }

    if (updateDto.name !== undefined) {
      ahcPackage.name = updateDto.name;
    }

    if (updateDto.labServiceIds !== undefined) {
      ahcPackage.labServiceIds = updateDto.labServiceIds;
    }

    if (updateDto.diagnosticServiceIds !== undefined) {
      ahcPackage.diagnosticServiceIds = updateDto.diagnosticServiceIds;
    }

    return ahcPackage.save();
  }

  async toggleActive(packageId: string): Promise<AhcPackage> {
    const ahcPackage = await this.getPackageById(packageId);
    ahcPackage.isActive = !ahcPackage.isActive;
    return ahcPackage.save();
  }

  async deletePackage(packageId: string): Promise<void> {
    const result = await this.ahcPackageModel.deleteOne({ packageId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`AHC Package ${packageId} not found`);
    }
  }

  async searchPackages(query: string): Promise<AhcPackage[]> {
    return this.ahcPackageModel
      .find({
        $or: [
          { packageId: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
