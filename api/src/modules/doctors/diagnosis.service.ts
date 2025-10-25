import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diagnosis, DiagnosisDocument } from './schemas/diagnosis.schema';

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectModel(Diagnosis.name)
    private diagnosisModel: Model<DiagnosisDocument>,
  ) {}

  /**
   * Search diagnoses by name or ICD code for autocomplete
   * @param query - Search query string (minimum 2 characters)
   * @param limit - Maximum number of results to return (default 20)
   * @returns Array of matching diagnoses
   */
  async searchDiagnoses(query: string, limit = 20): Promise<DiagnosisDocument[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const diagnoses = await this.diagnosisModel
      .find({
        $or: [
          { diagnosisName: { $regex: query, $options: 'i' } },
          { icdCode: { $regex: query, $options: 'i' } },
          { searchText: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      })
      .limit(limit)
      .sort({ diagnosisName: 1 })
      .exec();

    return diagnoses;
  }

  /**
   * Get diagnoses by category
   * @param category - Diagnosis category
   * @param limit - Maximum number of results (default 50)
   * @returns Array of diagnoses in the category
   */
  async getDiagnosesByCategory(category: string, limit = 50): Promise<DiagnosisDocument[]> {
    return await this.diagnosisModel
      .find({ category, isActive: true })
      .limit(limit)
      .sort({ diagnosisName: 1 })
      .exec();
  }

  /**
   * Get all active diagnosis categories
   * @returns Array of unique category names
   */
  async getCategories(): Promise<string[]> {
    return await this.diagnosisModel.distinct('category', { isActive: true });
  }
}
