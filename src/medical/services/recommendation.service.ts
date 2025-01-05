import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService
  ) {
    this.logger.debug('Initializing RecommendationService');
  }

  async getTreatmentRecommendations(condition: string) {
    try {
      const cacheKey = `treatment:${condition}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const { data, error } = await this.databaseService.getClient()
        .from('treatment_recommendations')
        .select('*')
        .eq('condition', condition)
        .single();

      if (error) throw error;
      if (!data) return null;

      await this.cacheService.set(cacheKey, JSON.stringify(data), 3600);
      return data;
    } catch (error) {
      throw new Error(`Failed to get treatment recommendations: ${error.message}`);
    }
  }

  async getRecommendations(condition: string, type: string, ageGroup?: string) {
    this.logger.debug(`Getting recommendations for condition: ${condition}, type: ${type}, age: ${ageGroup}`);
    try {
      const cacheKey = `recommendations:${condition}:${type}:${ageGroup || 'all'}`;
      
      // Check cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const query = this.databaseService.getClient()
        .from('recommendations')
        .select('*')
        .eq('condition', condition)
        .eq('type', type);

      if (ageGroup) {
        query.eq('age_group', ageGroup);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      if (!data) return null;

      // Cache result
      await this.cacheService.set(cacheKey, JSON.stringify(data), 3600);

      return data;
    } catch (error) {
      this.logger.error(`Failed to get recommendations: ${error.message}`);
      throw error;
    }
  }

  // Add other recommendation methods as needed
} 