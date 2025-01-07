import { Injectable } from '@nestjs/common';

export interface LabResult {
  testType: string;
  value: number;
  unit: string;
  date: Date;
  notes?: string;
}

@Injectable()
export class LaboratoryService {
  private readonly labResults: Map<string, LabResult[]> = new Map();

  async getLabResults(patientId: string): Promise<LabResult[]> {
    return this.labResults.get(patientId) || [];
  }

  async createLabResult(patientId: string, result: LabResult): Promise<LabResult> {
    if (!this.labResults.has(patientId)) {
      this.labResults.set(patientId, []);
    }
    const patientResults = this.labResults.get(patientId)!;
    const newResult = { ...result, date: new Date(result.date) };
    patientResults.push(newResult);
    return newResult;
  }
} 