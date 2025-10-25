import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Symptom, SymptomDocument } from './schemas/symptom.schema';

@Injectable()
export class SymptomsService {
  constructor(
    @InjectModel(Symptom.name)
    private symptomModel: Model<SymptomDocument>,
  ) {}

  /**
   * Search symptoms by name for autocomplete
   * @param query - Search query string (minimum 2 characters)
   * @param limit - Maximum number of results to return (default 20)
   * @returns Array of matching symptoms
   */
  async searchSymptoms(query: string, limit = 20): Promise<SymptomDocument[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const symptoms = await this.symptomModel
      .find({
        $or: [
          { symptomName: { $regex: query, $options: 'i' } },
          { searchText: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      })
      .limit(limit)
      .sort({ symptomName: 1 })
      .exec();

    return symptoms;
  }

  /**
   * Get symptoms by category
   * @param category - Symptom category
   * @param limit - Maximum number of results (default 50)
   * @returns Array of symptoms in the category
   */
  async getSymptomsByCategory(category: string, limit = 50): Promise<SymptomDocument[]> {
    return await this.symptomModel
      .find({ category, isActive: true })
      .limit(limit)
      .sort({ symptomName: 1 })
      .exec();
  }

  /**
   * Get all active symptom categories
   * @returns Array of unique category names
   */
  async getCategories(): Promise<string[]> {
    return await this.symptomModel.distinct('category', { isActive: true });
  }

  /**
   * Get symptoms by severity level
   * @param severity - Severity level (Mild, Moderate, Severe)
   * @param limit - Maximum number of results (default 50)
   * @returns Array of symptoms with the specified severity level
   */
  async getSymptomsBySeverity(severity: string, limit = 50): Promise<SymptomDocument[]> {
    return await this.symptomModel
      .find({
        severityLevels: severity,
        isActive: true,
      })
      .limit(limit)
      .sort({ symptomName: 1 })
      .exec();
  }
}
