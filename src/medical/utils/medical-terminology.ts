export class MedicalTerminology {
  private static readonly commonTerms = new Set([
    // Symptoms
    'pain', 'ache', 'fever', 'nausea', 'fatigue',
    // Conditions
    'hypertension', 'diabetes', 'asthma', 'arthritis',
    // Anatomical terms
    'cardiac', 'pulmonary', 'hepatic', 'renal',
    // Measurements
    'blood pressure', 'heart rate', 'temperature'
  ]);

  static extractTerms(text: string): Set<string> {
    const terms = new Set<string>();
    const words = text.toLowerCase().split(/\s+/);

    words.forEach(word => {
      if (this.commonTerms.has(word)) terms.add(word);
    });

    return terms;
  }
} 