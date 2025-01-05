import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    emergency_load: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 100,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '1m', target: 0 }
      ]
    }
  },
  thresholds: {
    'http_req_duration{scenario:emergency_load}': ['p(95)<2000'],
    'http_req_failed{scenario:emergency_load}': ['rate<0.01']
  }
};

export default function () {
  const BASE_URL = 'http://localhost:3000';

  // Emergency assessment scenario
  const emergencyResponse = http.post(`${BASE_URL}/emergency/assess`, {
    symptoms: ['severe chest pain'],
    vitals: { bloodPressure: '160/95' }
  });

  check(emergencyResponse, {
    'emergency response is fast': (r) => r.timings.duration < 2000,
    'emergency assessment is provided': (r) => r.json('urgencyLevel') !== undefined
  });

  sleep(1);
} 