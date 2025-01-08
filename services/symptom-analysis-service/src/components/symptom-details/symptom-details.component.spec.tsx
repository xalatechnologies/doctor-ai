import { render, screen } from '@testing-library/react';
import { SymptomDetails } from './symptom-details.component';
import { SymptomAnalysis } from '@interfaces/symptom.interface';

describe('SymptomDetails', () => {
  const mockAnalysis: SymptomAnalysis = {
    symptomId: 'SYM-123',
    primarySymptom: 'headache',
    secondarySymptoms: ['nausea', 'sensitivity to light'],
    severity: {
      level: 7,
      description: 'Severe'
    },
    possibleConditions: ['Migraine', 'Tension headache'],
    recommendations: ['Rest', 'Take prescribed medication'],
    urgencyLevel: 'HIGH',
    requiredSpecialties: ['Neurologist'],
    followUpActions: ['Schedule follow-up in 2 days'],
    timestamp: new Date().toISOString()
  };

  it('should render symptom analysis details', () => {
    render(<SymptomDetails analysis={mockAnalysis} />);

    expect(screen.getByText('headache')).toBeInTheDocument();
    expect(screen.getByText(/Severe \(7\/10\)/)).toBeInTheDocument();
    expect(screen.getByText('Migraine')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('should render recommendations section', () => {
    render(<SymptomDetails analysis={mockAnalysis} />);

    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
    mockAnalysis.recommendations.forEach(rec => {
      expect(screen.getByText(rec)).toBeInTheDocument();
    });
  });

  it('should render follow-up actions', () => {
    render(<SymptomDetails analysis={mockAnalysis} />);

    expect(screen.getByText(/follow-up actions/i)).toBeInTheDocument();
    mockAnalysis.followUpActions.forEach(action => {
      expect(screen.getByText(action)).toBeInTheDocument();
    });
  });

  it('should format timestamp correctly', () => {
    render(<SymptomDetails analysis={mockAnalysis} />);

    const formattedDate = new Date(mockAnalysis.timestamp).toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });
}); 