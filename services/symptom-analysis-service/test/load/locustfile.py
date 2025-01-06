from locust import HttpUser, task, between
import random
import json

class SymptomAnalysisUser(HttpUser):
    wait_time = between(1, 3)  # Wait between 1-3 seconds between tasks

    def on_start(self):
        """Initialize user data on start."""
        self.symptoms = [
            "headache", "chest pain", "back pain", "abdominal pain",
            "shortness of breath", "dizziness", "nausea", "fatigue"
        ]
        self.durations = ["acute", "chronic", "few hours", "few days", "weeks"]
        self.medications = [
            "aspirin", "ibuprofen", "paracetamol", "amoxicillin",
            "omeprazole", "metformin", "amlodipine", "lisinopril"
        ]

    def generate_symptom_data(self):
        """Generate random symptom data for testing."""
        primary_symptom = random.choice(self.symptoms)
        secondary_symptoms = random.sample(
            [s for s in self.symptoms if s != primary_symptom],
            k=random.randint(0, 3)
        )
        
        return {
            "description": f"Patient experiencing {primary_symptom}",
            "primarySymptom": primary_symptom,
            "painLevel": random.randint(1, 10),
            "severityLevel": random.randint(1, 10),
            "duration": random.choice(self.durations),
            "secondarySymptoms": secondary_symptoms,
            "alleviatingFactors": ["rest", "medication"] if random.random() > 0.5 else [],
            "aggravatingFactors": ["movement", "stress"] if random.random() > 0.5 else [],
            "currentMedications": random.sample(self.medications, k=random.randint(0, 3)),
            "patientHistory": "Previous conditions" if random.random() > 0.7 else None
        }

    @task(3)  # Higher weight for the main analysis endpoint
    def analyze_symptoms(self):
        """Test the main symptom analysis endpoint."""
        headers = {'Content-Type': 'application/json'}
        data = self.generate_symptom_data()
        
        with self.client.post(
            "/symptom-analysis/analyze",
            json=data,
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f"Failed with status code: {response.status_code}")

    @task(1)
    def check_health(self):
        """Test the health check endpoint."""
        with self.client.get("/health", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed with status code: {response.status_code}")

class EmergencyScenarioUser(HttpUser):
    wait_time = between(0.1, 1)  # Faster requests to simulate emergency scenarios

    def on_start(self):
        """Initialize emergency scenario data."""
        self.emergency_categories = ["CARDIAC", "RESPIRATORY", "NEUROLOGICAL"]
        self.severity_levels = ["HIGH", "MEDIUM", "LOW"]

    def generate_emergency_data(self):
        """Generate random emergency assessment data."""
        return {
            "assessment": {
                "category": random.choice(self.emergency_categories),
                "severity": "HIGH",  # Always high for emergency scenarios
                "immediateActions": ["Call emergency services", "Prepare for immediate care"]
            },
            "patientData": {
                "medications": random.sample([
                    "aspirin", "nitroglycerin", "beta blockers", "blood thinners"
                ], k=random.randint(1, 3))
            }
        }

    @task
    def simulate_emergency(self):
        """Simulate emergency scenarios with high-priority cases."""
        headers = {'Content-Type': 'application/json'}
        data = self.generate_emergency_data()
        
        with self.client.post(
            "/symptom-analysis/analyze",
            json=data,
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f"Emergency scenario failed with status code: {response.status_code}")

class HighVolumeUser(HttpUser):
    wait_time = between(0.01, 0.1)  # Very short wait times for high volume testing

    def on_start(self):
        """Initialize data for high volume testing."""
        self.basic_symptom_data = {
            "description": "routine check",
            "primarySymptom": "headache",
            "painLevel": 5,
            "severityLevel": 4,
            "duration": "acute"
        }

    @task
    def rapid_analysis_request(self):
        """Send rapid requests to test system capacity."""
        headers = {'Content-Type': 'application/json'}
        
        with self.client.post(
            "/symptom-analysis/analyze",
            json=self.basic_symptom_data,
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f"High volume request failed with status code: {response.status_code}") 