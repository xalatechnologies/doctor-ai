# Doctor AI - User Stories & Test Specifications

## 1. Emergency Assessment

1. **Urgent Cardiac Assessment**
   ```gherkin
   As a patient with chest pain
   I want to get an immediate assessment of my symptoms
   So that I can determine if I need emergency care

   Acceptance Criteria:
   - Response time must be under 2 seconds
   - Must assess severity on a scale (low/medium/high/critical)
   - Must provide clear "Next Steps" instructions
   - Must consider age and pre-existing conditions
   - Must trigger emergency alerts for critical cases
   - Must provide nearest emergency facility locations
   - Must validate vital sign inputs
   - Must track assessment timestamp

   Test Scenarios:
   1. Critical Case:
      - Input: Severe chest pain, BP 160/95, Age 65+
      - Expected: Critical severity, immediate action
   2. Moderate Case:
      - Input: Mild chest pain, normal vitals
      - Expected: Medium severity, monitor closely
   3. Edge Cases:
      - Invalid vital signs
      - Missing patient history
      - Concurrent symptoms

   Postman Testing:
   ```http
   POST {{baseUrl}}/emergency/assess
   Content-Type: application/json
   Authorization: Bearer {{apiKey}}

   {
     "symptoms": {
       "primary": "chest pain",
       "characteristics": ["sharp", "radiating"],
       "severity": 8,
       "duration": "30m",
       "vitals": {
         "bloodPressure": "160/95",
         "heartRate": 110,
         "oxygenSaturation": 92
       }
     },
     "patientContext": {
       "age": 65,
       "conditions": ["hypertension"],
       "medications": ["lisinopril"]
     }
   }

   // Tests
   pm.test("Response Time", () => {
     pm.expect(pm.response.responseTime).to.be.below(2000);
   });

   pm.test("Critical Assessment", () => {
     const response = pm.response.json();
     pm.expect(response.assessment.severity).to.equal("critical");
     pm.expect(response.assessment.action).to.equal("immediate_emergency_care");
     pm.expect(response.nearestFacilities).to.be.an("array");
   });
   ```
   ```

2. **Stroke Symptom Check**
   ```gherkin
   As a family member of someone showing stroke symptoms
   I want to quickly validate the symptoms
   So I can take appropriate immediate action

   Acceptance Criteria:
   - Must implement complete FAST protocol assessment
   - Response time under 1 second
   - Must provide nearest stroke center locations
   - Must include time-critical instructions
   - Must track symptom onset time
   - Must provide emergency contact options
   - Must support one-handed operation
   - Must work offline for basic assessment

   Test Scenarios:
   1. Full FAST Protocol:
      - Test each FAST component
      - Verify time tracking
      - Check facility routing
   2. Partial Symptoms:
      - Single FAST symptom
      - Multiple mild symptoms
   3. Edge Cases:
      - No GPS access
      - Poor connectivity
      - Language barriers

   Postman Testing:
   ```http
   POST {{baseUrl}}/emergency/stroke-assessment
   Content-Type: application/json

   {
     "symptoms": {
       "face": {
         "drooping": true,
         "side": "left",
         "onset": "{{$timestamp}}"
       },
       "arms": {
         "weakness": true,
         "side": "left",
         "canHold": false
       },
       "speech": {
         "slurred": true,
         "confused": true,
         "sampleText": "The sky is blue"
       },
       "time": {
         "firstNoticed": "{{$timestamp}}",
         "lastNormal": "{{$isoTimestamp}}"
       }
     },
     "location": {
       "latitude": 40.7128,
       "longitude": -74.0060,
       "accuracy": 10
     }
   }

   // Tests
   pm.test("FAST Protocol Complete", () => {
     const response = pm.response.json();
     pm.expect(response.assessment).to.include.all.keys(['face', 'arms', 'speech', 'time']);
     pm.expect(response.strokeProbability).to.be.above(0.8);
     pm.expect(response.nearestStrokeCenter).to.exist;
   });

   pm.test("Emergency Instructions", () => {
     const response = pm.response.json();
     pm.expect(response.instructions).to.be.an("array");
     pm.expect(response.emergencyContacts).to.exist;
   });
   ```
   ```

3. **Pediatric Emergency**
   ```gherkin
   As a parent of a child with high fever
   I want to assess the severity of the situation
   So I can decide whether to go to emergency or wait

   Acceptance Criteria:
   - Must consider age-specific fever thresholds
   - Must check for critical symptoms
   - Must provide age-appropriate dosing guidance
   - Must track fever progression
   - Must integrate vaccination history
   - Must provide clear fever management steps
   - Must identify emergency warning signs
   - Must support temperature unit conversion

   Test Scenarios:
   1. Age Groups:
      - Newborn (<3 months)
      - Infant (3-12 months)
      - Toddler (1-3 years)
   2. Fever Levels:
      - Low-grade
      - Moderate
      - High
   3. Edge Cases:
      - Unknown vaccination status
      - Recent medications
      - Multiple symptoms

   Postman Testing:
   ```http
   POST {{baseUrl}}/emergency/pediatric-assess
   Content-Type: application/json

   {
     "patient": {
       "age": "18m",
       "weight": "11kg",
       "vaccinations": ["upToDate"],
       "existingConditions": []
     },
     "symptoms": {
       "temperature": {
         "value": 39.5,
         "unit": "C",
         "method": "temporal",
         "timestamp": "{{$timestamp}}"
       },
       "duration": "6h",
       "associated": [
         "lethargy",
         "poorFeeding"
       ],
       "medications": {
         "lastDose": {
           "name": "acetaminophen",
           "amount": "120mg",
           "time": "{{$isoTimestamp}}"
         }
       }
     }
   }

   // Tests
   pm.test("Age-Appropriate Assessment", () => {
     const response = pm.response.json();
     pm.expect(response.assessment.ageGroup).to.equal("toddler");
     pm.expect(response.dosing).to.exist;
     pm.expect(response.warningSignsToWatch).to.be.an("array");
   });
   ```
   ```

## 2. Symptom Analysis

1. **Chronic Condition Analysis**
   ```gherkin
   As a patient with ongoing symptoms
   I want a comprehensive analysis of my condition
   So I can understand potential causes and next steps

   Acceptance Criteria:
   - Must analyze symptom patterns over time
   - Must consider multiple contributing factors
   - Must provide confidence levels for each analysis
   - Must suggest relevant specialists
   - Must track symptom severity changes
   - Must identify potential triggers
   - Must integrate with medical history
   - Must provide evidence-based recommendations

   Test Scenarios:
   1. Long-term Symptom Pattern:
      - Input: 3-month chronic fatigue data
      - Expected: Pattern analysis, trigger identification
   2. Multiple Symptom Correlation:
      - Input: Joint pain + fatigue + sleep issues
      - Expected: Potential condition matches
   3. Edge Cases:
      - Rare symptom combinations
      - Conflicting patterns
      - Incomplete history

   Postman Testing:
   ```http
   POST {{baseUrl}}/symptoms/analyze/chronic
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "primarySymptom": {
       "type": "fatigue",
       "duration": "3m",
       "pattern": "fluctuating",
       "severity": {
         "average": 6,
         "range": [4, 8]
       }
     },
     "associatedSymptoms": [
       {
         "type": "joint_pain",
         "locations": ["knees", "wrists"],
         "pattern": "morning_worse"
       },
       {
         "type": "sleep_disturbance",
         "details": "difficulty_staying_asleep"
       }
     ],
     "timeline": {
       "onset": "2023-12-01",
       "progressionNotes": [
         {
           "date": "2023-12-15",
           "change": "worsening",
           "triggers": ["physical_activity"]
         }
       ]
     }
   }

   // Tests
   pm.test("Comprehensive Analysis", () => {
     const response = pm.response.json();
     pm.expect(response.analysis).to.include.all.keys([
       'potentialConditions',
       'confidenceScores',
       'recommendedSpecialists',
       'suggestedTests'
     ]);
     pm.expect(response.analysis.potentialConditions).to.be.an('array');
     pm.expect(response.timeline.patterns).to.exist;
   });

   pm.test("Evidence-Based Recommendations", () => {
     const response = pm.response.json();
     pm.expect(response.recommendations).to.be.an('array');
     response.recommendations.forEach(rec => {
       pm.expect(rec).to.have.property('evidenceLevel');
       pm.expect(rec).to.have.property('source');
     });
   });
   ```
   ```

2. **Multiple Symptom Correlation**
   ```gherkin
   As someone experiencing multiple symptoms
   I want to understand how they might be related
   So I can better describe them to my doctor

   Acceptance Criteria:
   - Must identify potential relationships between symptoms
   - Must rank correlations by strength
   - Must visualize symptom relationships
   - Must track temporal relationships
   - Must consider environmental factors
   - Must provide medical terminology mapping
   - Must generate summary reports
   - Must highlight critical combinations

   Test Scenarios:
   1. Related Symptoms:
      - Input: Cluster of respiratory symptoms
      - Expected: Correlation analysis, system mapping
   2. Temporal Patterns:
      - Input: Symptoms with time-based relationships
      - Expected: Timeline analysis, trigger patterns
   3. Complex Cases:
      - Multiple system involvement
      - Cyclical patterns
      - Interaction effects

   Postman Testing:
   ```http
   POST {{baseUrl}}/symptoms/analyze/correlation
   Content-Type: application/json

   {
     "symptoms": [
       {
         "id": "cough",
         "onset": "{{$isoTimestamp}}",
         "severity": 7,
         "characteristics": ["dry", "nocturnal"],
         "triggers": ["exercise", "cold_air"]
       },
       {
         "id": "shortness_of_breath",
         "onset": "{{$isoTimestamp}}",
         "severity": 5,
         "characteristics": ["exertional"],
         "relievingFactors": ["rest"]
       },
       {
         "id": "chest_tightness",
         "onset": "{{$isoTimestamp}}",
         "severity": 6,
         "pattern": "morning_worse"
       }
     ],
     "environmentalFactors": {
       "season": "winter",
       "airQuality": "moderate",
       "recentChanges": ["new_workplace"]
     }
   }

   // Tests
   pm.test("Correlation Analysis", () => {
     const response = pm.response.json();
     pm.expect(response.correlations).to.be.an('array');
     response.correlations.forEach(correlation => {
       pm.expect(correlation).to.have.all.keys([
         'symptoms',
         'strength',
         'confidence',
         'medicalTerminology',
         'suggestedQuestions'
       ]);
     });
   });

   pm.test("System Mapping", () => {
     const response = pm.response.json();
     pm.expect(response.systemMapping).to.exist;
     pm.expect(response.systemMapping.affectedSystems).to.include('respiratory');
     pm.expect(response.visualizations).to.exist;
   });
   ```
   ```

3. **Symptom Timeline Analysis**
   ```gherkin
   As a patient with evolving symptoms
   I want to track changes in my condition over time
   So I can identify patterns or deterioration

   Acceptance Criteria:
   - Must track symptom progression over time
   - Must identify trends and patterns
   - Must detect significant changes
   - Must correlate with treatments/interventions
   - Must generate visual timelines
   - Must support multiple tracking methods
   - Must allow custom tracking parameters
   - Must provide trend alerts

   Test Scenarios:
   1. Progressive Symptoms:
      - Input: Daily symptom logs over 30 days
      - Expected: Progression analysis, trend detection
   2. Treatment Impact:
      - Input: Symptoms before/after interventions
      - Expected: Effectiveness analysis
   3. Complex Patterns:
      - Cyclical symptoms
      - Multiple interventions
      - Environmental correlations

   Postman Testing:
   ```http
   POST {{baseUrl}}/symptoms/timeline/analyze
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "timeframe": {
       "start": "{{$isoTimestamp-30d}}",
       "end": "{{$isoTimestamp}}"
     },
     "symptoms": [
       {
         "id": "migraine",
         "dailyLogs": [
           {
             "date": "{{$isoTimestamp-30d}}",
             "severity": 3,
             "duration": "4h",
             "triggers": ["stress"]
           }
           // ... more daily entries
         ],
         "interventions": [
           {
             "type": "medication",
             "name": "sumatriptan",
             "startDate": "{{$isoTimestamp-15d}}",
             "dose": "50mg"
           }
         ]
       }
     ],
     "environmentalData": {
       "weather": true,
       "activity": true,
       "stress": true
     }
   }

   // Tests
   pm.test("Timeline Analysis", () => {
     const response = pm.response.json();
     pm.expect(response.timeline).to.exist;
     pm.expect(response.patterns).to.be.an('array');
     pm.expect(response.trends).to.have.property('direction');
     pm.expect(response.interventionImpact).to.exist;
   });

   pm.test("Visualization Data", () => {
     const response = pm.response.json();
     pm.expect(response.visualizations).to.include.all.keys([
       'severityChart',
       'patternGraph',
       'triggerCorrelations'
     ]);
   });
   ```
   ```

## 3. Treatment Recommendations

1. **Personalized Treatment Plan**
   ```gherkin
   As a patient with a chronic condition
   I want personalized treatment recommendations
   So I can better manage my condition

   Acceptance Criteria:
   - Must consider patient's full medical history
   - Must account for current medications
   - Must check for contraindications
   - Must provide lifestyle modifications
   - Must include monitoring plan
   - Must adapt to treatment response
   - Must consider patient preferences
   - Must provide alternative options

   Test Scenarios:
   1. Standard Treatment:
      - Input: Type 2 diabetes, standard case
      - Expected: Comprehensive management plan
   2. Complex Case:
      - Input: Multiple conditions, medication restrictions
      - Expected: Adapted recommendations
   3. Special Considerations:
      - Pregnancy
      - Elderly care
      - Pediatric adjustments

   Postman Testing:
   ```http
   POST {{baseUrl}}/treatment/recommend
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "condition": {
       "primary": "type2_diabetes",
       "diagnosed": "{{$isoTimestamp-180d}}",
       "metrics": {
         "hba1c": 7.8,
         "fastingGlucose": 145,
         "weight": 85,
         "bmi": 28.4
       }
     },
     "currentTreatment": {
       "medications": [
         {
           "name": "metformin",
           "dose": "1000mg",
           "frequency": "BID",
           "adherence": 0.9
         }
       ],
       "lifestyle": {
         "diet": "standard",
         "exercise": "sedentary",
         "stress": "moderate"
       }
     },
     "preferences": {
       "treatmentIntensity": "moderate",
       "lifestyle": ["diet_willing", "exercise_limited"],
       "monitoring": "daily"
     }
   }

   // Tests
   pm.test("Personalized Recommendations", () => {
     const response = pm.response.json();
     pm.expect(response.plan).to.include.all.keys([
       'medications',
       'lifestyle',
       'monitoring',
       'goals'
     ]);
     pm.expect(response.plan.contraindications).to.be.an('array');
     pm.expect(response.plan.alternatives).to.exist;
   });

   pm.test("Treatment Safety", () => {
     const response = pm.response.json();
     pm.expect(response.safety).to.include.all.keys([
       'interactions',
       'warnings',
       'monitoringRequirements'
     ]);
   });
   ```
   ```

2. **Alternative Treatment Options**
   ```gherkin
   As someone with chronic pain
   I want to explore different treatment approaches
   So I can find the most effective solution

   Acceptance Criteria:
   - Must provide evidence-based alternatives
   - Must rank options by effectiveness
   - Must consider patient preferences
   - Must include complementary therapies
   - Must evaluate cost implications
   - Must assess accessibility
   - Must provide success rate data
   - Must include potential side effects

   Test Scenarios:
   1. Standard to Alternative:
      - Input: Chronic back pain, conventional treatment resistant
      - Expected: Ranked alternative options
   2. Complementary Therapies:
      - Input: Preference for natural approaches
      - Expected: Evidence-based natural solutions
   3. Integration Cases:
      - Combined conventional/alternative approaches
      - Staged treatment plans
      - Cost-benefit analysis

   Postman Testing:
   ```http
   POST {{baseUrl}}/treatment/alternatives
   Content-Type: application/json

   {
     "condition": {
       "primary": "chronic_back_pain",
       "duration": "2y",
       "previousTreatments": [
         {
           "type": "medication",
           "name": "nsaids",
           "effectiveness": "limited",
           "sideEffects": ["gastric_irritation"]
         },
         {
           "type": "physical_therapy",
           "duration": "6m",
           "effectiveness": "moderate"
         }
       ],
       "preferences": {
         "approach": ["natural", "non_invasive"],
         "costLevel": "moderate",
         "timeCommitment": "flexible"
       }
     }
   }

   // Tests
   pm.test("Alternative Options", () => {
     const response = pm.response.json();
     pm.expect(response.alternatives).to.be.an('array');
     response.alternatives.forEach(option => {
       pm.expect(option).to.include.all.keys([
         'treatment',
         'evidenceLevel',
         'effectiveness',
         'costEstimate',
         'timeCommitment',
         'accessibility'
       ]);
     });
   });

   pm.test("Evidence-Based Recommendations", () => {
     const response = pm.response.json();
     pm.expect(response.evidenceBase).to.exist;
     pm.expect(response.clinicalTrials).to.be.an('array');
     pm.expect(response.successRates).to.exist;
   });
   ```
   ```

3. **Treatment Progress Monitoring**
   ```gherkin
   As someone undergoing treatment
   I want to track my progress and response
   So I can optimize my treatment plan

   Acceptance Criteria:
   - Must track key health metrics
   - Must monitor treatment adherence
   - Must detect adverse reactions
   - Must evaluate effectiveness
   - Must support goal tracking
   - Must enable provider updates
   - Must generate progress reports
   - Must provide trend analysis

   Test Scenarios:
   1. Metric Tracking:
      - Input: Daily health metrics over 3 months
      - Expected: Trend analysis, goal progress
   2. Treatment Response:
      - Input: Medication effectiveness data
      - Expected: Response analysis, adjustments
   3. Alert Scenarios:
      - Adverse reactions
      - Missed medications
      - Declining metrics

   Postman Testing:
   ```http
   POST {{baseUrl}}/treatment/progress/track
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "treatmentPlan": {
       "id": "{{treatmentPlanId}}",
       "metrics": [
         {
           "type": "blood_pressure",
           "readings": [
             {
               "value": "130/85",
               "timestamp": "{{$isoTimestamp-7d}}"
             },
             {
               "value": "128/82",
               "timestamp": "{{$isoTimestamp}}"
             }
           ]
         },
         {
           "type": "medication_adherence",
           "data": {
             "prescribed": 14,
             "taken": 13,
             "missedDoses": ["{{$isoTimestamp-3d}}"]
           }
         }
       ],
       "sideEffects": [
         {
           "type": "fatigue",
           "severity": "mild",
           "onset": "{{$isoTimestamp-5d}}"
         }
       ]
     }
   }

   // Tests
   pm.test("Progress Tracking", () => {
     const response = pm.response.json();
     pm.expect(response.progress).to.include.all.keys([
       'metrics',
       'adherence',
       'effectiveness',
       'sideEffects'
     ]);
     pm.expect(response.trends).to.exist;
     pm.expect(response.recommendations).to.exist;
   });

   pm.test("Alert Generation", () => {
     const response = pm.response.json();
     pm.expect(response.alerts).to.be.an('array');
     if (response.alerts.length > 0) {
       pm.expect(response.alerts[0]).to.include.all.keys([
         'type',
         'severity',
         'recommendation'
       ]);
     }
   });
   ```
   ```

## 4. Medical History Analysis

1. **Pattern Recognition**
   ```gherkin
   As a patient with recurring symptoms
   I want to analyze patterns in my medical history
   So I can identify triggers and trends

   Acceptance Criteria:
   - Must analyze historical medical records
   - Must identify recurring patterns
   - Must correlate symptoms with triggers
   - Must detect seasonal patterns
   - Must track frequency changes
   - Must consider lifestyle factors
   - Must generate visual timelines
   - Must provide predictive insights

   Test Scenarios:
   1. Recurring Conditions:
      - Input: 2-year migraine history
      - Expected: Pattern identification, trigger analysis
   2. Seasonal Analysis:
      - Input: Allergy symptoms over multiple years
      - Expected: Seasonal correlations
   3. Complex Cases:
      - Multiple condition interactions
      - Lifestyle change impacts
      - Medication effect patterns

   Postman Testing:
   ```http
   POST {{baseUrl}}/history/analyze/patterns
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "timeframe": {
       "start": "{{$isoTimestamp-730d}}",
       "end": "{{$isoTimestamp}}"
     },
     "conditions": ["migraine"],
     "analysisParameters": {
       "includeSeasonality": true,
       "includeTriggers": true,
       "includeLifestyleFactors": true
     }
   }

   // Tests
   pm.test("Pattern Analysis", () => {
     const response = pm.response.json();
     pm.expect(response.patterns).to.be.an('array');
     pm.expect(response.seasonalTrends).to.exist;
     pm.expect(response.triggers).to.be.an('object');
     pm.expect(response.predictions).to.exist;
   });

   pm.test("Visualization Data", () => {
     const response = pm.response.json();
     pm.expect(response.visualizations).to.include.all.keys([
       'frequencyTimeline',
       'seasonalHeatmap',
       'triggerCorrelations'
     ]);
   });
   ```
   ```

2. **Treatment History Analysis**
   ```gherkin
   As a patient with a complex medical history
   I want to analyze the effectiveness of past treatments
   So I can make informed decisions about future care

   Acceptance Criteria:
   - Must evaluate treatment effectiveness
   - Must identify adverse reactions
   - Must track treatment durations
   - Must compare treatment options
   - Must consider cost-effectiveness
   - Must analyze adherence patterns
   - Must identify optimal combinations
   - Must track long-term outcomes

   Test Scenarios:
   1. Treatment Comparison:
      - Input: Multiple treatment approaches for same condition
      - Expected: Comparative effectiveness analysis
   2. Side Effect Analysis:
      - Input: Treatment history with adverse reactions
      - Expected: Risk pattern identification
   3. Adherence Impact:
      - Input: Variable adherence patterns
      - Expected: Effectiveness correlation

   Postman Testing:
   ```http
   POST {{baseUrl}}/history/analyze/treatments
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "condition": "hypertension",
     "treatments": [
       {
         "medication": "lisinopril",
         "period": {
           "start": "{{$isoTimestamp-365d}}",
           "end": "{{$isoTimestamp-180d}}"
         },
         "adherence": 0.85,
         "effectiveness": {
           "bpReadings": [
             {
               "date": "{{$isoTimestamp-365d}}",
               "value": "150/95"
             },
             {
               "date": "{{$isoTimestamp-180d}}",
               "value": "135/85"
             }
           ]
         },
         "sideEffects": ["cough"]
       },
       {
         "medication": "amlodipine",
         "period": {
           "start": "{{$isoTimestamp-180d}}",
           "end": "{{$isoTimestamp}}"
         },
         "adherence": 0.95,
         "effectiveness": {
           "bpReadings": [
             {
               "date": "{{$isoTimestamp-180d}}",
               "value": "135/85"
             },
             {
               "date": "{{$isoTimestamp}}",
               "value": "128/82"
             }
           ]
         }
       }
     ]
   }

   // Tests
   pm.test("Treatment Effectiveness", () => {
     const response = pm.response.json();
     pm.expect(response.treatments).to.be.an('array');
     response.treatments.forEach(treatment => {
       pm.expect(treatment).to.include.all.keys([
         'effectivenessScore',
         'adherenceImpact',
         'sideEffectProfile',
         'costEffectiveness'
       ]);
     });
   });

   pm.test("Comparative Analysis", () => {
     const response = pm.response.json();
     pm.expect(response.comparison).to.exist;
     pm.expect(response.recommendations).to.be.an('array');
     pm.expect(response.riskBenefitAnalysis).to.exist;
   });
   ```
   ```

## 5. Real-time Monitoring

1. **Vital Signs Monitoring**
   ```gherkin
   As a cardiac patient
   I want continuous monitoring of my vital signs
   So I can receive alerts for concerning changes

   Acceptance Criteria:
   - Must monitor vital signs in real-time
   - Must detect abnormal patterns
   - Must provide immediate alerts
   - Must support multiple devices
   - Must handle connection interruptions
   - Must maintain data accuracy
   - Must support customizable thresholds
   - Must provide emergency notifications

   Test Scenarios:
   1. Normal Monitoring:
      - Input: Continuous vital sign stream
      - Expected: Regular updates, baseline tracking
   2. Alert Conditions:
      - Input: Abnormal vital signs
      - Expected: Immediate alerts, escalation
   3. Edge Cases:
      - Device disconnection
      - Data anomalies
      - Multiple concurrent alerts

   Postman Testing:
   ```http
   # WebSocket Connection
   GET {{baseUrl}}/monitoring/vitals/connect
   Connection: Upgrade
   Upgrade: websocket

   # REST API for Configuration
   POST {{baseUrl}}/monitoring/vitals/configure
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "deviceId": "{{deviceId}}",
     "thresholds": {
       "heartRate": {
         "low": 50,
         "high": 120,
         "criticalLow": 40,
         "criticalHigh": 150
       },
       "bloodPressure": {
         "systolicHigh": 160,
         "diastolicHigh": 100,
         "systolicLow": 90,
         "diastolicLow": 60
       },
       "oxygenSaturation": {
         "low": 92,
         "critical": 88
       }
     },
     "alertSettings": {
       "notificationChannels": ["app", "sms", "email"],
       "escalationRules": {
         "critical": {
           "delay": 0,
           "recipients": ["emergency_contact", "healthcare_provider"]
         }
       }
     }
   }

   // Tests
   pm.test("Real-time Connection", () => {
     const ws = new WebSocket(pm.variables.get("wsUrl"));
     pm.expect(ws.readyState).to.equal(WebSocket.CONNECTING);
     
     ws.onopen = () => {
       pm.expect(ws.readyState).to.equal(WebSocket.OPEN);
     };
   });

   pm.test("Alert Configuration", () => {
     const response = pm.response.json();
     pm.expect(response.configuration).to.be.an('object');
     pm.expect(response.thresholds).to.exist;
     pm.expect(response.alertRules).to.exist;
   });
   ```
   ```

2. **Medication Compliance Monitoring**
   ```gherkin
   As someone on multiple medications
   I want real-time tracking of my medication schedule
   So I can maintain optimal adherence

   Acceptance Criteria:
   - Must track medication schedules
   - Must send timely reminders
   - Must verify medication intake
   - Must detect missed doses
   - Must support multiple medications
   - Must handle time zones
   - Must track inventory levels
   - Must support caregiver monitoring

   Test Scenarios:
   1. Regular Schedule:
      - Input: Daily medication plan
      - Expected: Timely reminders, intake tracking
   2. Complex Regimens:
      - Input: Multiple medications, varying schedules
      - Expected: Coordinated reminders, interaction checks
   3. Special Cases:
      - Travel across time zones
      - PRN medications
      - Dose adjustments

   Postman Testing:
   ```http
   POST {{baseUrl}}/monitoring/medications/track
   Content-Type: application/json

   {
     "patientId": "{{patientId}}",
     "medications": [
       {
         "name": "metformin",
         "schedule": {
           "frequency": "BID",
           "times": ["08:00", "20:00"],
           "timezone": "America/New_York"
         },
         "inventory": {
           "current": 45,
           "reorderAt": 10,
           "daysSupply": 30
         }
       }
     ],
     "verificationMethod": "app_confirmation",
     "reminderSettings": {
       "advance": 15,
       "repeat": 5,
       "maxReminders": 3
     },
     "caregiverNotifications": {
       "enabled": true,
       "missedDoses": true,
       "lowInventory": true
     }
   }

   // Tests
   pm.test("Medication Tracking", () => {
     const response = pm.response.json();
     pm.expect(response.schedule).to.be.an('array');
     pm.expect(response.nextReminders).to.exist;
     pm.expect(response.adherenceStats).to.exist;
   });

   pm.test("Reminder System", () => {
     const response = pm.response.json();
     pm.expect(response.reminders).to.be.an('array');
     response.reminders.forEach(reminder => {
       pm.expect(reminder).to.include.all.keys([
         'medication',
         'scheduledTime',
         'reminderTimes'
       ]);
     });
   });
   ```
   ```

[Continue with more real-time monitoring stories...] 