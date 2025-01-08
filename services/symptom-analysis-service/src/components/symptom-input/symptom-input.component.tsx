import React, { useState } from 'react';

interface SymptomInputProps {
  onSubmit: (data: any) => void;
  onChange: (data: any) => void;
}

export const SymptomInput: React.FC<SymptomInputProps> = ({ onSubmit, onChange }) => {
  const [formData, setFormData] = useState({
    primarySymptom: '',
    severityLevel: '',
    duration: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    onChange({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.primarySymptom) {
      setErrors({ primarySymptom: 'Primary symptom is required' });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="primarySymptom">Primary Symptom</label>
        <input
          id="primarySymptom"
          name="primarySymptom"
          type="text"
          value={formData.primarySymptom}
          onChange={handleChange}
          aria-label="primary symptom"
        />
        {errors.primarySymptom && <span>{errors.primarySymptom}</span>}
      </div>

      <div>
        <label htmlFor="severity">Severity</label>
        <input
          id="severity"
          name="severityLevel"
          type="number"
          min="1"
          max="10"
          value={formData.severityLevel}
          onChange={handleChange}
          aria-label="severity"
        />
      </div>

      <div>
        <label htmlFor="duration">Duration</label>
        <input
          id="duration"
          name="duration"
          type="text"
          value={formData.duration}
          onChange={handleChange}
          aria-label="duration"
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}; 