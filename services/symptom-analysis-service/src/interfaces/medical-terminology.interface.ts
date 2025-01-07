export interface MedicalTerminology {
  validateTerm(term: string): Promise<string>;
  getSuggestions(partialTerm: string): Promise<string[]>;
  extractTerms(text: string): Set<string>;
  isValidTerm(term: string): boolean;
  getStandardizedTerm(term: string): string;
  getRelatedTerms(term: string): Promise<string[]>;
  getCategoryForTerm(term: string): string;
  getAnatomicalRegion(term: string): string;
  getCommonSynonyms(term: string): string[];
  isAbbreviation(term: string): boolean;
  expandAbbreviation(abbreviation: string): string;
  getTermDefinition(term: string): Promise<string>;
  getTermSeverityScale(term: string): string[];
  getTermTimePattern(term: string): string[];
  getTermRiskFactors(term: string): Promise<string[]>;
} 