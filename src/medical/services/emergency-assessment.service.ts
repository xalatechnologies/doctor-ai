import { Injectable } from '@nestjs/common';
import {
  SymptomAnalysis,
  VitalSigns,
  EmergencyRecommendation,
  EmergencyFacility
} from '../types/medical.types';

@Injectable()
export class EmergencyAssessmentService {
  private readonly redFlags = new Set<string>([
    'severe_chest_pain',
    'difficulty_breathing',
    'stroke_symptoms',
    'severe_head_injury',
    'loss_of_consciousness',
    'severe_bleeding',
    'seizure',
    'severe_allergic_reaction',
    'severe_abdominal_pain',
    'suicidal_ideation'
  ]);

  private readonly vitalSignThresholds = {
    systolicBPHigh: 180,
    systolicBPLow: 90,
    diastolicBPHigh: 120,
    diastolicBPLow: 60,
    heartRateHigh: 120,
    heartRateLow: 50,
    temperatureHigh: 39.5, // Celsius
    temperatureLow: 35.0,
    oxygenSaturationLow: 92,
    respiratoryRateHigh: 24,
    respiratoryRateLow: 8
  };

  async assessEmergencyLevel(
    symptoms: SymptomAnalysis,
    vitalSigns: VitalSigns
  ): Promise<{
    emergencyLevel: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent';
    recommendations: EmergencyRecommendation[];
    nearestFacilities?: EmergencyFacility[];
  }> {
    const emergencyScore = this.calculateEmergencyScore(symptoms, vitalSigns);
    const emergencyLevel = this.determineEmergencyLevel(emergencyScore);
    const recommendations = this.generateRecommendations(emergencyLevel, symptoms);
    
    if (emergencyLevel === 'immediate' || emergencyLevel === 'urgent') {
      const facilities = await this.findNearestEmergencyFacilities(symptoms);
      return { emergencyLevel, recommendations, nearestFacilities: facilities };
    }

    return { emergencyLevel, recommendations };
  }

  private calculateEmergencyScore(symptoms: SymptomAnalysis, vitalSigns: VitalSigns): number {
    let score = 0;

    // Check for red flag symptoms
    symptoms.primarySymptoms.forEach(symptom => {
      if (this.redFlags.has(symptom.symptom)) {
        score += 10;
      }
      if (symptom.severity >= 8) {
        score += 5;
      }
    });

    // Check vital signs
    if (vitalSigns) {
      if (vitalSigns.bloodPressure) {
        const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map(Number);
        if (systolic > this.vitalSignThresholds.systolicBPHigh || 
            systolic < this.vitalSignThresholds.systolicBPLow ||
            diastolic > this.vitalSignThresholds.diastolicBPHigh ||
            diastolic < this.vitalSignThresholds.diastolicBPLow) {
          score += 5;
        }
      }

      if (vitalSigns.oxygenSaturation && 
          vitalSigns.oxygenSaturation < this.vitalSignThresholds.oxygenSaturationLow) {
        score += 8;
      }

      if (vitalSigns.respiratoryRate &&
         (vitalSigns.respiratoryRate > this.vitalSignThresholds.respiratoryRateHigh ||
          vitalSigns.respiratoryRate < this.vitalSignThresholds.respiratoryRateLow)) {
        score += 7;
      }
    }

    return score;
  }

  private determineEmergencyLevel(score: number): 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent' {
    if (score >= 15) return 'immediate';
    if (score >= 10) return 'urgent';
    if (score >= 5) return 'semi-urgent';
    return 'non-urgent';
  }

  private generateRecommendations(
    level: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent',
    symptoms: SymptomAnalysis
  ): EmergencyRecommendation[] {
    const recommendations: EmergencyRecommendation[] = [];

    switch (level) {
      case 'immediate':
        recommendations.push({
          action: 'Call emergency services immediately',
          priority: 1,
          timeframe: 'Immediate',
          instructions: 'Do not delay, call emergency services (113) right now'
        });
        break;

      case 'urgent':
        recommendations.push({
          action: 'Seek immediate medical attention',
          priority: 1,
          timeframe: '1-2 hours',
          instructions: 'Visit nearest emergency department or urgent care facility'
        });
        break;

      case 'semi-urgent':
        recommendations.push({
          action: 'Schedule urgent care visit',
          priority: 2,
          timeframe: '12-24 hours',
          instructions: 'Book an urgent appointment with your doctor or visit an urgent care clinic'
        });
        break;

      case 'non-urgent':
        recommendations.push({
          action: 'Monitor and schedule routine visit if needed',
          priority: 3,
          timeframe: '1-3 days',
          instructions: 'Monitor symptoms and schedule a routine appointment if symptoms persist'
        });
        break;
    }

    return recommendations;
  }

  private async findNearestEmergencyFacilities(symptoms: SymptomAnalysis): Promise<EmergencyFacility[]> {
    // This would integrate with a real geolocation service
    // Returning mock data for now
    return [
      {
        name: 'Oslo University Hospital',
        distance: 2.5,
        specialties: ['Emergency Medicine', 'Trauma Center', 'Cardiac Care'],
        contactInfo: '+47 123 45 678',
        coordinates: {
          latitude: 59.9139,
          longitude: 10.7522
        }
      }
    ];
  }
} 