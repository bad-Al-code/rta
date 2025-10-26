/**
 * @fileoverview Load test for authentication endpoints with 100 concurrent users
 * @description Tests both signup and login endpoints under high concurrent load
 * @author badal
 * @version 1.0.0
 *
 * @requires k6
 * @requires http
 * @requires k6/metrics
 *
 * @usage
 * Start server: SKIP_RATE_LIMIT=true pnpm dev
 * Run test: k6 run load-test-100-users.js
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * @typedef {Object} TestUser
 * @property {string} email - User email address
 * @property {string} password - User password
 */

/**
 * Custom metrics for detailed performance tracking
 */
const signupSuccessRate = new Rate('signup_success_rate');
const loginSuccessRate = new Rate('login_success_rate');
const signupDuration = new Trend('signup_duration_ms');
const loginDuration = new Trend('login_duration_ms');
const totalErrors = new Counter('total_error_count');
const authenticationErrors = new Counter('authentication_error_count');

/**
 * Test configuration and scenarios
 */
export const options = {
  scenarios: {
    seed_users: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 10,
      maxDuration: '3m',
      exec: 'seedUsers',
      tags: { scenario: 'seed' },
    },
    signup_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      exec: 'testSignup',
      startTime: '30s',
      tags: { scenario: 'signup' },
    },
    login_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      exec: 'testLogin',
      startTime: '45s',
      tags: { scenario: 'login' },
    },
    mixed_load: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '2m', target: 30 },
        { duration: '1m', target: 10 },
      ],
      preAllocatedVUs: 50,
      maxVUs: 150,
      exec: 'testMixed',
      startTime: '1m',
      tags: { scenario: 'mixed' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    'http_req_duration{endpoint:signup}': ['p(95)<2500', 'p(99)<4000'],
    'http_req_duration{endpoint:login}': ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.15'],
    signup_success_rate: ['rate>0.85'],
    login_success_rate: ['rate>0.85'],
    signup_duration_ms: ['p(95)<2500'],
    login_duration_ms: ['p(95)<2000'],
    total_error_count: ['count<500'],
    authentication_error_count: ['count<200'],
    checks: ['rate>0.80'],
  },
};

const BASE_URL = 'http://localhost:4000/api/v1';
const PASSWORD = 'LoadTest123!';
const createdUsers = [];

/**
 * Generates a unique email address for testing
 * @param {string} prefix - Email prefix identifier
 * @returns {string} Generated email address
 */
function generateEmail(prefix = 'user') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const vuId = __VU;
  const iter = __ITER;
  return `${prefix}_${vuId}_${iter}_${timestamp}_${random}@loadtest.com`;
}

/**
 * Generates a random full name
 * @returns {string} Generated full name
 */
function generateName() {
  const firstNames = [
    'James',
    'Mary',
    'John',
    'Patricia',
    'Robert',
    'Jennifer',
    'Michael',
    'Linda',
    'William',
    'Elizabeth',
    'David',
    'Barbara',
    'Richard',
    'Susan',
    'Joseph',
    'Jessica',
    'Thomas',
    'Sarah',
    'Charles',
    'Karen',
    'Christopher',
    'Nancy',
    'Daniel',
    'Lisa',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Thompson',
    'White',
    'Harris',
  ];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Seeds initial users into the system for login testing
 * @returns {void}
 */
export function seedUsers() {
  const email = generateEmail('seed');
  const name = generateName();
  const payload = JSON.stringify({ email, password: PASSWORD, name });

  const res = http.post(`${BASE_URL}/auth/signup`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'signup', phase: 'seeding' },
    timeout: '15s',
  });

  const success = check(res, {
    seed_status_201: (r) => r.status === 201,
    seed_has_user_id: (r) => {
      try {
        return JSON.parse(r.body).id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (success && res.status === 201) {
    createdUsers.push({ email, password: PASSWORD });
  }

  sleep(0.2);
}

/**
 * Tests signup endpoint under load
 * @returns {void}
 */
export function testSignup() {
  const startTime = Date.now();

  group('signup_flow', () => {
    const email = generateEmail('signup');
    const name = generateName();
    const payload = JSON.stringify({ email, password: PASSWORD, name });

    const res = http.post(`${BASE_URL}/auth/signup`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'signup', phase: 'load' },
      timeout: '15s',
    });

    const duration = Date.now() - startTime;
    signupDuration.add(duration);

    const checks = check(res, {
      signup_status_201: (r) => r.status === 201,
      signup_has_id: (r) => {
        try {
          return JSON.parse(r.body).id !== undefined;
        } catch {
          return false;
        }
      },
      signup_has_email: (r) => {
        try {
          return JSON.parse(r.body).email === email;
        } catch {
          return false;
        }
      },
      signup_no_password_leak: (r) => {
        const body = r.body.toLowerCase();
        return !body.includes('passwordhash') && !body.includes('password');
      },
      signup_time_under_3s: (r) => r.timings.duration < 3000,
      signup_time_under_5s: (r) => r.timings.duration < 5000,
    });

    const success = res.status === 201;
    signupSuccessRate.add(success);

    if (success) {
      createdUsers.push({ email, password: PASSWORD });
    } else {
      totalErrors.add(1);
      if (res.status === 401 || res.status === 403) {
        authenticationErrors.add(1);
      }
    }
  });

  sleep(Math.random() * 1.5 + 0.5);
}

/**
 * Tests login endpoint under load
 * @returns {void}
 */
export function testLogin() {
  const startTime = Date.now();

  group('login_flow', () => {
    if (createdUsers.length === 0) {
      sleep(1);
      return;
    }

    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const res = http.post(`${BASE_URL}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login', phase: 'load' },
      timeout: '15s',
    });

    const duration = Date.now() - startTime;
    loginDuration.add(duration);

    const checks = check(res, {
      login_status_200: (r) => r.status === 200,
      login_has_token: (r) => {
        try {
          return JSON.parse(r.body).accessToken !== undefined;
        } catch {
          return false;
        }
      },
      login_has_user: (r) => {
        try {
          return JSON.parse(r.body).user !== undefined;
        } catch {
          return false;
        }
      },
      login_correct_email: (r) => {
        try {
          return JSON.parse(r.body).user.email === user.email;
        } catch {
          return false;
        }
      },
      login_no_password_leak: (r) => {
        const body = r.body.toLowerCase();
        return (
          !body.includes('passwordhash') && !body.includes('password_hash')
        );
      },
      login_time_under_2s: (r) => r.timings.duration < 2000,
      login_time_under_3s: (r) => r.timings.duration < 3000,
    });

    const success = res.status === 200;
    loginSuccessRate.add(success);

    if (!success) {
      totalErrors.add(1);
      if (res.status === 401 || res.status === 403) {
        authenticationErrors.add(1);
      }
    }
  });

  sleep(Math.random() * 1 + 0.5);
}

/**
 * Tests mixed signup and login requests to simulate real usage
 * @returns {void}
 */
export function testMixed() {
  const scenario = Math.random();

  if (scenario < 0.3) {
    group('mixed_signup', () => {
      const email = generateEmail('mixed_signup');
      const name = generateName();
      const payload = JSON.stringify({ email, password: PASSWORD, name });

      const res = http.post(`${BASE_URL}/auth/signup`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'signup', phase: 'mixed' },
        timeout: '15s',
      });

      check(res, {
        mixed_signup_success: (r) => r.status === 201,
        mixed_signup_fast: (r) => r.timings.duration < 3000,
      });

      if (res.status === 201) {
        createdUsers.push({ email, password: PASSWORD });
        signupSuccessRate.add(true);
      } else {
        signupSuccessRate.add(false);
        totalErrors.add(1);
      }
    });
  } else if (scenario < 0.8) {
    group('mixed_login', () => {
      if (createdUsers.length === 0) {
        sleep(0.5);
        return;
      }

      const user =
        createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const payload = JSON.stringify({
        email: user.email,
        password: user.password,
      });

      const res = http.post(`${BASE_URL}/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'login', phase: 'mixed' },
        timeout: '15s',
      });

      check(res, {
        mixed_login_success: (r) => r.status === 200,
        mixed_login_fast: (r) => r.timings.duration < 2000,
      });

      if (res.status === 200) {
        loginSuccessRate.add(true);
      } else {
        loginSuccessRate.add(false);
        totalErrors.add(1);
      }
    });
  } else {
    group('mixed_journey', () => {
      const email = generateEmail('journey');
      const name = generateName();
      const signupPayload = JSON.stringify({ email, password: PASSWORD, name });

      const signupRes = http.post(`${BASE_URL}/auth/signup`, signupPayload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'signup', phase: 'journey' },
        timeout: '15s',
      });

      const signupSuccess = check(signupRes, {
        journey_signup_success: (r) => r.status === 201,
      });

      if (signupSuccess && signupRes.status === 201) {
        signupSuccessRate.add(true);
        createdUsers.push({ email, password: PASSWORD });

        sleep(Math.random() * 2 + 1);

        const loginPayload = JSON.stringify({ email, password: PASSWORD });
        const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
          headers: { 'Content-Type': 'application/json' },
          tags: { endpoint: 'login', phase: 'journey' },
          timeout: '15s',
        });

        check(loginRes, {
          journey_login_success: (r) => r.status === 200,
          journey_login_has_token: (r) => {
            try {
              return JSON.parse(r.body).accessToken !== undefined;
            } catch {
              return false;
            }
          },
        });

        if (loginRes.status === 200) {
          loginSuccessRate.add(true);
        } else {
          loginSuccessRate.add(false);
          totalErrors.add(1);
        }
      } else {
        signupSuccessRate.add(false);
        totalErrors.add(1);
      }
    });
  }

  sleep(Math.random() * 2 + 1);
}

/**
 * Setup function executed before test scenarios
 * @returns {void}
 * @throws {Error} If server health check fails
 */
export function setup() {
  const healthUrl = BASE_URL.replace('/api/v1', '/health');
  const healthCheck = http.get(healthUrl, { timeout: '5s' });

  if (healthCheck.status !== 200) {
    throw new Error(
      'Server health check failed. Status: ' + healthCheck.status
    );
  }
}

/**
 * Teardown function executed after all test scenarios complete
 * @returns {void}
 */
export function teardown() {
  const totalCreated = createdUsers.length;
}
