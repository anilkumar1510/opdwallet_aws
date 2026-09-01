import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PharmacyMedicine, PharmacyMedicineDocument } from '../schemas/pharmacy-medicine.schema';

@Injectable()
export class PharmacyCatalogueService {
  constructor(
    @InjectModel(PharmacyMedicine.name) private medicineModel: Model<PharmacyMedicineDocument>,
  ) {}

  async search(query?: string): Promise<PharmacyMedicine[]> {
    const filter: any = { isActive: true };
    if (query?.trim()) {
      filter.$or = [
        { name: new RegExp(query.trim(), 'i') },
        { genericName: new RegExp(query.trim(), 'i') },
      ];
    }
    return this.medicineModel.find(filter).sort({ name: 1 }).lean().exec();
  }

  async findById(medicineId: string): Promise<PharmacyMedicine | null> {
    return this.medicineModel.findOne({ medicineId, isActive: true }).lean().exec();
  }
}
