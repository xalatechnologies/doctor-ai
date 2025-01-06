import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyService } from '@services/emergency.service';
import { EmergencyCategory, EmergencySeverity } from '@interfaces/emergency.interface';
import { EmergencyAssessmentException, InvalidEmergencyDataException } from '@exceptions/emergency.exception';
import { AssessEmergencyDto } from '@dto/assess-emergency.dto';

describe('EmergencyService', () => {
  let service: EmergencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmergencyService],
    }).compile();

    service = module.get<EmergencyService>(EmergencyService);
  });

  describe('Service Setup', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required methods', () => {
      expect(service.assessEmergency).toBeDefined();
      expect(typeof service.assessEmergency).toBe('function');
    });
  });

  describe('Emergency Category Detection', () => {
    const testCases = [
      {
        description: 'severe chest pain and shortness of breath',
        expectedCategory: EmergencyCategory.CARDIAC,
        label: 'cardiac symptoms'
      },
      {
        description: 'difficulty breathing and wheezing',
        expectedCategory: EmergencyCategory.RESPIRATORY,
        label: 'respiratory symptoms'
      },
      {
        description: 'severe bleeding from a cut',
        expectedCategory: EmergencyCategory.TRAUMA,
        label: 'trauma symptoms'
      },
      {
        description: 'sudden onset of seizures',
        expectedCategory: EmergencyCategory.NEUROLOGICAL,
        label: 'neurological symptoms'
      },
      {
        description: 'mild fever and cough',
        expectedCategory: EmergencyCategory.GENERAL,
        label: 'general symptoms'
      }
    ];

    testCases.forEach(({ description, expectedCategory, label }) => {
      it(`should correctly identify ${label}`, async () => {
        const result = await service.assessEmergency({
          description,
          age: '45',
        });
        expect(result.category).toBe(expectedCategory);
      });
    });
  });

  describe('Severity Assessment', () => {
    it('should assess HIGH severity for cardiac emergencies', async () => {
      const result = await service.assessEmergency({
        description: 'severe chest pain and shortness of breath',
        age: '65',
      });
      expect(result.severity).toBe(EmergencySeverity.HIGH);
      expect(result.requiresAmbulance).toBe(true);
    });

    it('should assess HIGH severity for respiratory emergencies', async () => {
      const result = await service.assessEmergency({
        description: 'severe difficulty breathing',
        age: '40',
      });
      expect(result.severity).toBe(EmergencySeverity.HIGH);
      expect(result.requiresAmbulance).toBe(true);
    });

    it('should assess MEDIUM severity for cases with existing conditions', async () => {
      const result = await service.assessEmergency({
        description: 'mild pain',
        age: '50',
        existingConditions: ['diabetes', 'hypertension'],
      });
      expect(result.severity).toBe(EmergencySeverity.MEDIUM);
    });

    it('should assess LOW severity for minor symptoms', async () => {
      const result = await service.assessEmergency({
        description: 'mild headache',
        age: '30',
      });
      expect(result.severity).toBe(EmergencySeverity.LOW);
      expect(result.requiresAmbulance).toBe(false);
    });
  });

  describe('Triage Score Calculation', () => {
    it('should calculate maximum triage score for severe cases', async () => {
      const result = await service.assessEmergency({
        description: 'severe chest pain',
        age: '70',
        existingConditions: ['heart disease', 'diabetes'],
        medications: ['aspirin', 'insulin'],
      });
      expect(result.triageScore).toBe(10); // Max score
    });

    it('should calculate lower triage score for minor cases', async () => {
      const result = await service.assessEmergency({
        description: 'mild fever',
        age: '25',
      });
      expect(result.triageScore).toBeLessThan(5);
    });
  });

  describe('Recommendations Generation', () => {
    it('should include immediate actions for HIGH severity cases', async () => {
      const result = await service.assessEmergency({
        description: 'severe chest pain',
        age: '60',
      });
      expect(result.immediateActions).toContain('Call 911');
      expect(result.recommendations).toContain('Call emergency services (911) immediately');
    });

    it('should include category-specific recommendations for cardiac cases', async () => {
      const result = await service.assessEmergency({
        description: 'chest pain and shortness of breath',
        age: '55',
      });
      expect(result.recommendations).toContain('Have the patient sit or lie down');
      expect(result.recommendations).toContain('Loosen any tight clothing');
    });

    it('should include medication information in recommendations', async () => {
      const result = await service.assessEmergency({
        description: 'feeling unwell',
        age: '45',
        medications: ['insulin', 'metformin'],
      });
      expect(result.recommendations).toContain('Have current medications ready: insulin, metformin');
    });
  });

  describe('Error Handling', () => {
    it('should throw InvalidEmergencyDataException for missing description', async () => {
      await expect(service.assessEmergency({
        description: '',
        age: '50',
      })).rejects.toThrow(InvalidEmergencyDataException);
    });

    it('should throw InvalidEmergencyDataException for missing age', async () => {
      await expect(service.assessEmergency({
        description: 'chest pain',
        age: '',
      })).rejects.toThrow(InvalidEmergencyDataException);
    });

    it('should handle empty arrays for optional fields', async () => {
      const result = await service.assessEmergency({
        description: 'feeling dizzy',
        age: '45',
        existingConditions: [],
        medications: [],
      });
      expect(result).toBeDefined();
      expect(result.severity).toBe(EmergencySeverity.LOW);
    });
  });

  describe('Timestamp Generation', () => {
    it('should include a valid ISO timestamp', async () => {
      const result = await service.assessEmergency({
        description: 'headache',
        age: '30',
      });
      expect(Date.parse(result.timestamp)).not.toBeNaN();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Edge Cases and Special Scenarios', () => {
    it('should handle multiple conditions in description', async () => {
      const result = await service.assessEmergency({
        description: 'chest pain with difficulty breathing and bleeding',
        age: '55',
      });
      expect(result.severity).toBe(EmergencySeverity.HIGH);
      expect(result.category).toBe(EmergencyCategory.CARDIAC); // Should prioritize cardiac
    });

    it('should handle pediatric cases differently', async () => {
      const result = await service.assessEmergency({
        description: 'fever and cough',
        age: '2',
      });
      expect(result.severity).not.toBe(EmergencySeverity.LOW); // Children should get higher priority
      expect(result.recommendations).toContain('Inform emergency responders about pediatric case');
    });

    it('should handle elderly cases with higher priority', async () => {
      const result = await service.assessEmergency({
        description: 'dizziness and weakness',
        age: '85',
      });
      expect(result.severity).not.toBe(EmergencySeverity.LOW);
      expect(result.triageScore).toBeGreaterThan(5);
    });

    it('should handle multiple medications with interactions', async () => {
      const result = await service.assessEmergency({
        description: 'feeling unwell',
        age: '60',
        medications: ['warfarin', 'aspirin', 'clopidogrel'],
      });
      expect(result.severity).toBe(EmergencySeverity.MEDIUM);
      expect(result.recommendations).toContain('Alert medical staff about blood thinners');
    });

    it('should prioritize immediate life-threatening conditions', async () => {
      const result = await service.assessEmergency({
        description: 'not breathing, unconscious',
        age: '45',
      });
      expect(result.severity).toBe(EmergencySeverity.HIGH);
      expect(result.immediateActions).toContain('Begin CPR if necessary');
      expect(result.triageScore).toBe(10);
    });
  });

  describe('Complex Medical History Cases', () => {
    it('should handle multiple chronic conditions', async () => {
      const result = await service.assessEmergency({
        description: 'feeling weak',
        age: '70',
        existingConditions: [
          'diabetes',
          'hypertension',
          'chronic kidney disease',
          'heart failure'
        ],
        medications: [
          'insulin',
          'lisinopril',
          'metformin',
          'furosemide'
        ],
      });
      expect(result.severity).toBe(EmergencySeverity.MEDIUM);
      expect(result.triageScore).toBeGreaterThan(7);
    });

    it('should handle recent surgery cases', async () => {
      const result = await service.assessEmergency({
        description: 'pain in surgical site',
        age: '45',
        existingConditions: ['recent heart surgery'],
        medications: ['warfarin', 'painkillers'],
      });
      expect(result.severity).toBe(EmergencySeverity.HIGH);
      expect(result.recommendations).toContain('Inform emergency responders about: recent heart surgery');
    });

    it('should handle allergic reaction cases', async () => {
      const result = await service.assessEmergency({
        description: 'difficulty breathing after eating peanuts',
        age: '30',
        existingConditions: ['peanut allergy'],
      });
      expect(result.severity).toBe(EmergencySeverity.HIGH);
      expect(result.immediateActions).toContain('Check airway');
      expect(result.recommendations).toContain('Use EpiPen if available');
    });
  });

  describe('Language and Description Processing', () => {
    it('should handle misspelled symptoms', async () => {
      const result = await service.assessEmergency({
        description: 'chest pane and hart attack',
        age: '60',
      });
      expect(result.category).toBe(EmergencyCategory.CARDIAC);
      expect(result.severity).toBe(EmergencySeverity.HIGH);
    });

    it('should handle non-medical terminology', async () => {
      const result = await service.assessEmergency({
        description: 'heart feels funny and cant catch breath',
        age: '55',
      });
      expect(result.category).toBe(EmergencyCategory.CARDIAC);
      expect(result.severity).toBe(EmergencySeverity.HIGH);
    });

    it('should handle multiple languages', async () => {
      const result = await service.assessEmergency({
        description: 'dolor en el pecho severe and cant breathe',
        age: '50',
      });
      expect(result.category).toBe(EmergencyCategory.CARDIAC);
      expect(result.severity).toBe(EmergencySeverity.HIGH);
    });
  });
}); 