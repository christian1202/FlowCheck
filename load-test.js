import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================================
// CONFIGURATION
// ============================================================================
// Set these before running:
//   EVENT_ID:  The UUID or slug of a published ("open") event to target.
//   BASE_URL:  The base URL of the application (local or deployed preview).
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EVENT_ID = __ENV.EVENT_ID || 'replace-with-your-event-id';

export const options = {
  stages: [
    { duration: '10s', target: 50 },   // ramp up to 50 concurrent users
    { duration: '30s', target: 500 },  // spike to 500 concurrent users
    { duration: '10s', target: 0 },    // ramp down to 0
  ],
  thresholds: {
    // 95% of requests must complete within 500ms
    http_req_duration: ['p(95)<500'],
    // Less than 1% of requests may fail
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const url = `${BASE_URL}/api/events/${EVENT_ID}/register`;

  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    name: `Load Test User ${uniqueId}`,
    email: `loadtest-${uniqueId}@example.com`,
    local: 'Cebu City',
    district: 'North',
    zone: 'Zone 1',
    duty: 'Scanner',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    // Disable keep-alive so each VU opens a fresh connection — more realistic
    // for simulating thousands of distinct users.
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 201 (created) or 409 (already registered)': (r) =>
      r.status === 201 || r.status === 409,
    'status is not 500 (no server crash)': (r) => r.status !== 500,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Slight pause so virtual users don't hammer the exact same millisecond
  sleep(0.1);
}