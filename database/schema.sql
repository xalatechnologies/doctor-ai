CREATE TABLE medical_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    icd_10_code VARCHAR(10),
    snomed_ct_code VARCHAR(20),
    category VARCHAR(100) NOT NULL,
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
    requires_immediate_attention BOOLEAN DEFAULT false,
    common_symptoms JSONB,
    risk_factors JSONB,
    typical_progression TEXT,
    recommended_actions JSONB,
    contraindications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Index for faster searches
CREATE INDEX idx_medical_conditions_category ON medical_conditions(category);
CREATE INDEX idx_medical_conditions_severity ON medical_conditions(severity_level);

-- Extend the medical_conditions table
ALTER TABLE medical_conditions 
ADD COLUMN subcategory VARCHAR(100),
ADD COLUMN age_specific_info JSONB,
ADD COLUMN gender_specific_info JSONB,
ADD COLUMN seasonal_pattern VARCHAR(50),
ADD COLUMN genetic_factors JSONB,
ADD COLUMN diagnostic_criteria JSONB,
ADD COLUMN treatment_protocols JSONB,
ADD COLUMN prevention_measures JSONB,
ADD COLUMN complication_risks JSONB,
ADD COLUMN recovery_timeline JSONB;

-- Add more specific indexes
CREATE INDEX idx_medical_conditions_subcategory ON medical_conditions(subcategory);
CREATE INDEX idx_medical_conditions_seasonal ON medical_conditions(seasonal_pattern);
CREATE INDEX idx_medical_conditions_icd ON medical_conditions(icd_10_code);
CREATE INDEX idx_medical_conditions_snomed ON medical_conditions(snomed_ct_code);

-- Create a categories reference table
CREATE TABLE medical_condition_categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    typical_symptoms JSONB,
    standard_procedures JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a symptoms reference table
CREATE TABLE symptoms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    body_system VARCHAR(100),
    severity_scale JSONB,
    associated_conditions JSONB,
    red_flags JSONB,
    differential_diagnosis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a relationship table between conditions and symptoms
CREATE TABLE condition_symptoms (
    condition_id UUID REFERENCES medical_conditions(id),
    symptom_id INTEGER REFERENCES symptoms(id),
    relationship_type VARCHAR(50),
    frequency VARCHAR(50),
    severity_range JSONB,
    PRIMARY KEY (condition_id, symptom_id)
);

-- Add tables for recommendations and medical history

-- Recommendations table
CREATE TABLE medical_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condition_id UUID REFERENCES medical_conditions(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('lifestyle', 'medication', 'followup', 'prevention')),
    description TEXT NOT NULL,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    timeframe VARCHAR(100),
    notes TEXT[],
    age_group VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medical history table
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('consultation', 'diagnosis', 'treatment', 'followup')),
    description TEXT NOT NULL,
    diagnoses JSONB,
    treatments JSONB,
    follow_up JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_recommendations_condition ON medical_recommendations(condition_id);
CREATE INDEX idx_recommendations_type ON medical_recommendations(type);
CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX idx_medical_history_date ON medical_history(date);
CREATE INDEX idx_medical_history_type ON medical_history(type); 