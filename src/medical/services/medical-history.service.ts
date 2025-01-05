import { Injectable } from '@nestjs/common';
import { MedicalHistoryItemDto } from '../dto/medical-history.dto';
import { DatabaseService } from './database.service';

@Injectable()
export class MedicalHistoryService {
  constructor(private databaseService: DatabaseService) {}

  async getHistory(
    startDate: string,
    endDate?: string,
    type?: string
  ): Promise<MedicalHistoryItemDto[]> {
    try {
      const history = await this.fetchHistoryFromDB(startDate, endDate, type);
      return this.processHistoryRecords(history);
    } catch (error) {
      throw new Error(`Failed to fetch medical history: ${error.message}`);
    }
  }

  private async fetchHistoryFromDB(
    startDate: string,
    endDate?: string,
    type?: string
  ): Promise<any[]> {
    let query = this.databaseService.getClient()
      .from('medical_history')
      .select('*')
      .gte('date', startDate);

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return data || [];
  }

  private processHistoryRecords(records: any[]): MedicalHistoryItemDto[] {
    return records.map(record => ({
      date: record.date,
      type: record.type,
      description: record.description,
      diagnoses: record.diagnoses,
      treatments: record.treatments,
      followUp: record.follow_up
    }));
  }
} 