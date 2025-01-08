import React from 'react';
import { SymptomAnalysis } from '@interfaces/symptom.interface';

interface SymptomDetailsProps {
  analysis: SymptomAnalysis;
}

export const SymptomDetails: React.FC<SymptomDetailsProps> = ({ analysis }) => {
  return (
    <div>
      <h2>Symptom Analysis</h2>
      
      <div>
        <h3>Primary Symptom</h3>
        <p>{analysis.primarySymptom}</p>
      </div>

      <div>
        <h3>Severity</h3>
        <p>{analysis.severity.description} ({analysis.severity.level}/10)</p>
      </div>

      <div>
        <h3>Possible Conditions</h3>
        <ul>
          {analysis.possibleConditions.map((condition, index) => (
            <li key={index}>{condition}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Urgency Level</h3>
        <p>{analysis.urgencyLevel}</p>
      </div>

      <div>
        <h3>Recommendations</h3>
        <ul>
          {analysis.recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Follow-up Actions</h3>
        <ul>
          {analysis.followUpActions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Date</h3>
        <p>{new Date(analysis.timestamp).toLocaleDateString()}</p>
      </div>
    </div>
  );
}; 