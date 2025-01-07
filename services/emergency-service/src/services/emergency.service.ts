import { Injectable } from '@nestjs/common';
import { LoggerService } from '@app/common/logger';
import { RabbitMQService } from '@app/common/messaging';
import { LLMService } from '@app/common/llm';
import { MetricsService } from '@app/common/metrics';
import { AssessEmergencyDto } from '../dto/assess-emergency.dto';
import { EmergencyAssessment } from '../interfaces/emergency.interface';

@Injectable()
export class EmergencyService {
  constructor(
    private readonly logger: LoggerService,
    private readonly messaging: RabbitMQService,
    private readonly llm: LLMService,
    private readonly metrics: MetricsService
  ) {}

  async assessEmergency(data: AssessEmergencyDto): Promise<EmergencyAssessment> {
    const timer = this.logger.startTimer();
    try {
      this.logger.log(`Assessing emergency for data: ${JSON.stringify(data)}`);
      
      // Use LLM to analyze severity
      const prompt = `Analyze this emergency situation: ${data.description}. Primary symptom: ${data.primarySymptom}. Secondary symptoms: ${data.secondarySymptoms?.join(', ')}`;
      const analysis = await this.llm.generateResponse(prompt);
      
      const assessment: EmergencyAssessment = {
        description: data.description,
        primarySymptom: data.primarySymptom,
        secondarySymptoms: data.secondarySymptoms,
        analysis,
        timestamp: new Date().toISOString(),
      };

      // Emit assessment event
      await this.messaging.emit('emergency.assessed', assessment);
      
      timer.end('emergency_assessment');
      return assessment;
    } catch (error) {
      this.logger.error(`Failed to assess emergency`, error.stack);
      throw error;
    }
  }

  async handleEmergency(patientId: string, symptoms: string[]): Promise<void> {
    const timer = this.logger.startTimer();
    try {
      this.logger.log(`Processing emergency for patient ${patientId}`);
      
      // Use LLM to analyze severity
      const prompt = `Analyze these symptoms for severity: ${symptoms.join(', ')}`;
      const analysis = await this.llm.generateResponse(prompt);
      
      // Emit emergency event
      await this.messaging.emit('emergency.new', {
        patientId,
        symptoms,
        analysis,
        timestamp: new Date(),
      });
      
      this.logger.log(`Emergency processed for patient ${patientId}`);
      timer.end('emergency_processing');
    } catch (error) {
      this.logger.error(`Failed to process emergency for patient ${patientId}`, error.stack);
      throw error;
    }
  }

  async handleTreatmentPlan(data: { treatmentPlan: any; patientData: any }): Promise<void> {
    const timer = this.logger.startTimer();
    try {
      this.logger.log(`Processing treatment plan: ${JSON.stringify(data)}`);
      await this.messaging.emit('emergency.treatment.updated', {
        patientId: data.patientData.id,
        treatmentPlanId: data.treatmentPlan.id,
        status: 'IN_PROGRESS',
        timestamp: new Date().toISOString(),
      });
      timer.end('treatment_plan_processing');
    } catch (error) {
      this.logger.error(`Failed to process treatment plan`, error.stack);
      throw error;
    }
  }
} 