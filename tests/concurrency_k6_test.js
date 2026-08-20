import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = 'http://localhost:3000';
const STUDENT_ID = '23127155';

export const options = {
  scenarios: {
    ext01_cart_race_condition: {
      executor: 'per-vu-iterations',
      vus: 5,           // 5 concurrent virtual users
      iterations: 1,
      startTime: '0s',
    },
    ext01_cart_verify: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      startTime: '3s',  // runs after the race condition requests complete
    },
    ext05_category_concurrent: {
      executor: 'per-vu-iterations',
      vus: 2,           // 2 concurrent virtual admins
      iterations: 1,
      startTime: '6s',  // start after cart tests
    },
    ext05_category_verify: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      startTime: '9s',  // runs after category creation completes
    }
  }
};

export function setup() {
  // 1. Create a brand new user to guarantee an empty cart for EXT-01
  const uniqueEmail = `race_${Date.now()}@eshop.com`;
  http.post(`${BASE_URL}/api/register`, JSON.stringify({ name: 'Race User', email: uniqueEmail, password: 'Password123!' }), { headers: { 'Content-Type': 'application/json' } });

  const userRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({ email: uniqueEmail, password: 'Password123!' }), {
    headers: { 'Content-Type': 'application/json' }
  });
  const raceUserToken = userRes.json('token');

  // 2. Login to get Admin Token for EXT-05
  const adminPayload = JSON.stringify({ email: 'admin@eshop.com', password: 'Admin123!' });
  const adminRes = http.post(`${BASE_URL}/api/login`, adminPayload, {
    headers: { 'Content-Type': 'application/json' }
  });
  const adminToken = adminRes.json('token');

  // 3. Generate a unique category name so multiple runs don't conflict
  const uniqueCategoryName = `Concurrent Cat ${Date.now()}`;

  return { raceUserToken, adminToken, uniqueCategoryName };
}

export default function (data) {
  const scenarioName = exec.scenario.name;

  // --- EXT-01 Execution ---
  if (scenarioName === 'ext01_cart_race_condition') {
    const url = `${BASE_URL}/api/cart`;
    const payload = JSON.stringify({ id: 1, quantity: 1 });
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.raceUserToken}`,
      'X-Student-Id': STUDENT_ID
    };

    let res = http.post(url, payload, { headers: headers });
    check(res, {
      'EXT-01: Cart add status is 200': (r) => r.status === 200,
    });
  }

  // --- EXT-01 Verification ---
  if (scenarioName === 'ext01_cart_verify') {
    const url = `${BASE_URL}/api/cart`;
    const headers = {
      'Authorization': `Bearer ${data.raceUserToken}`,
      'X-Student-Id': STUDENT_ID
    };

    let res = http.get(url, { headers: headers });
    let cart = res.json();
    let product1 = cart.items ? cart.items.find(item => item.product_id === 1 || item.id === 1) : null;
    let qty = product1 ? product1.quantity : 0;

    check(res, {
      'EXT-01: API handled DB transaction properly (Quantity is exactly 5)': (r) => qty === 5,
    });
  }

  // --- EXT-05 Execution ---
  if (scenarioName === 'ext05_category_concurrent') {
    const url = `${BASE_URL}/api/categories`;
    const payload = JSON.stringify({ name: data.uniqueCategoryName });
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.adminToken}`,
      'X-Student-Id': STUDENT_ID
    };

    let res = http.post(url, payload, { headers: headers });
    check(res, {
      'EXT-05: Handled gracefully (No 500 error)': (r) => r.status !== 500,
      'EXT-05: Request returned 200/201 OR 400/409': (r) => [200, 201, 400, 409].includes(r.status)
    });
  }

  // --- EXT-05 Verification ---
  if (scenarioName === 'ext05_category_verify') {
    const url = `${BASE_URL}/api/categories`;
    const headers = { 'X-Student-Id': STUDENT_ID };
    let res = http.get(url, { headers: headers });

    let categories = res.json();
    let createdCount = categories.filter(c => c.name === data.uniqueCategoryName).length;

    check(res, {
      'EXT-05: DB Unique Constraint enforced (Exactly 1 category created)': (r) => createdCount === 1,
    });
  }
}

export function handleSummary(data) {
  return {
    "k6_concurrency_performance_report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
