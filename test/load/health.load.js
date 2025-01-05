import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up
    { duration: '1m', target: 100 },  // Stay at peak
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'], // 99% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% can fail
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3000';

  const responses = http.batch([
    ['GET', `${BASE_URL}/health`],
    ['GET', `${BASE_URL}/health/metrics`],
    ['GET', `${BASE_URL}/health/ready`],
  ]);

  check(responses[0], {
    'health status is ok': (r) => r.status === 200 && r.json('status') === 'ok',
  });

  sleep(1);
} 