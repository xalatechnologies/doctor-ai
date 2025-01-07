export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
}

export interface FHIRRiskAssessment extends FHIRResource {
  resourceType: 'RiskAssessment';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  subject: {
    reference: string;
  };
  occurrenceDateTime: string;
  condition?: {
    reference: string;
  };
  prediction: Array<{
    outcome: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    probabilityDecimal?: number;
    qualitativeRisk?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    whenRange?: {
      low: {
        value: number;
        unit: string;
        system: string;
        code: string;
      };
      high: {
        value: number;
        unit: string;
        system: string;
        code: string;
      };
    };
  }>;
  note?: Array<{
    text: string;
  }>;
}

export interface FHIRBundle extends FHIRResource {
  resourceType: 'Bundle';
  type: 'transaction' | 'batch' | 'collection';
  entry: Array<{
    resource: FHIRResource;
  }>;
}

export interface EHRExportOptions {
  patientReference: string;
  includeObservations?: boolean;
  includeRiskAssessments?: boolean;
  bundleType?: 'transaction' | 'batch' | 'collection';
} 