import { Injectable } from '@nestjs/common';
import { MedicalTerminology } from '../interfaces/medical-terminology.interface';

@Injectable()
export class MedicalTerminologyService implements MedicalTerminology {
  private readonly commonTerms = new Set([
    'acute', 'chronic', 'diagnosis', 'prognosis', 'etiology',
    'symptoms', 'signs', 'treatment', 'medication', 'therapy',
    'pathology', 'syndrome', 'condition', 'disease', 'disorder'
  ]);

  private readonly anatomicalTerms = new Set([
    'cardiac', 'pulmonary', 'hepatic', 'renal', 'neural',
    'gastric', 'cerebral', 'muscular', 'skeletal', 'vascular'
  ]);

  private readonly suffixes = new Set([
    'itis', 'emia', 'oma', 'osis', 'pathy',
    'plasty', 'ectomy', 'otomy', 'ostomy', 'scopy'
  ]);

  async validateTerm(term: string): Promise<string> {
    const cleanTerm = term.toLowerCase().trim();
    if (this.isValidTerm(cleanTerm)) {
      return this.getStandardizedTerm(cleanTerm);
    }
    throw new Error(`Invalid medical term: ${term}`);
  }

  async getSuggestions(partialTerm: string): Promise<string[]> {
    const cleanTerm = partialTerm.toLowerCase().trim();
    const suggestions: string[] = [];

    // Add common terms that start with the same letters
    this.commonTerms.forEach(commonTerm => {
      if (commonTerm.startsWith(cleanTerm)) {
        suggestions.push(commonTerm);
      }
    });

    // Add anatomical terms that start with the same letters
    this.anatomicalTerms.forEach(anatomicalTerm => {
      if (anatomicalTerm.startsWith(cleanTerm)) {
        suggestions.push(anatomicalTerm);
      }
    });

    return suggestions;
  }

  extractTerms(text: string): Set<string> {
    const terms = new Set<string>();
    const words = text.toLowerCase().split(/\s+/);

    words.forEach(word => {
      // Remove punctuation
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      
      // Check if it's a common medical term
      if (this.commonTerms.has(cleanWord)) {
        terms.add(cleanWord);
      }

      // Check if it's an anatomical term
      if (this.anatomicalTerms.has(cleanWord)) {
        terms.add(cleanWord);
      }

      // Check for medical suffixes
      Array.from(this.suffixes).forEach((suffix: string) => {
        if (cleanWord.endsWith(suffix) && cleanWord.length > suffix.length + 2) {
          terms.add(cleanWord);
        }
      });
    });

    return terms;
  }

  isValidTerm(term: string): boolean {
    const cleanTerm = term.toLowerCase().trim();
    
    // Check if it's a known term
    if (this.commonTerms.has(cleanTerm) || this.anatomicalTerms.has(cleanTerm)) {
      return true;
    }

    // Check for valid medical suffixes
    return Array.from(this.suffixes).some((suffix: string) => 
      cleanTerm.endsWith(suffix) && cleanTerm.length > suffix.length + 2
    );
  }

  getStandardizedTerm(term: string): string {
    const cleanTerm = term.toLowerCase().trim();
    // Add standardization logic here
    return cleanTerm;
  }

  async getRelatedTerms(term: string): Promise<string[]> {
    // Add related terms logic here
    return [];
  }

  getCategoryForTerm(term: string): string {
    // Add category detection logic here
    return 'general';
  }

  getAnatomicalRegion(term: string): string {
    // Add anatomical region detection logic here
    return 'unspecified';
  }

  getCommonSynonyms(term: string): string[] {
    // Add synonym lookup logic here
    return [];
  }

  isAbbreviation(term: string): boolean {
    // Add abbreviation detection logic here
    return false;
  }

  expandAbbreviation(abbreviation: string): string {
    // Add abbreviation expansion logic here
    return abbreviation;
  }

  async getTermDefinition(term: string): Promise<string> {
    // Add definition lookup logic here
    return '';
  }

  getTermSeverityScale(term: string): string[] {
    // Add severity scale logic here
    return ['mild', 'moderate', 'severe'];
  }

  getTermTimePattern(term: string): string[] {
    // Add time pattern logic here
    return ['acute', 'chronic'];
  }

  async getTermRiskFactors(term: string): Promise<string[]> {
    // Add risk factor lookup logic here
    return [];
  }
} 