export class MedicalTerminology {
  private static readonly commonTerms = new Set([
    'acute', 'chronic', 'diagnosis', 'prognosis', 'etiology',
    'symptoms', 'signs', 'treatment', 'medication', 'therapy',
    'pathology', 'syndrome', 'condition', 'disease', 'disorder'
  ]);

  private static readonly anatomicalTerms = new Set([
    'cardiac', 'pulmonary', 'hepatic', 'renal', 'neural',
    'gastric', 'cerebral', 'muscular', 'skeletal', 'vascular'
  ]);

  private static readonly suffixes = new Set([
    'itis', 'emia', 'oma', 'osis', 'pathy',
    'plasty', 'ectomy', 'otomy', 'ostomy', 'scopy'
  ]);

  static extractTerms(text: string): Set<string> {
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

  static validateTerm(term: string): boolean {
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

  static getSuggestions(term: string): string[] {
    const cleanTerm = term.toLowerCase().trim();
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
} 