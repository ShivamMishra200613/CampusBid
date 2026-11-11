import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const ACCOUNTS = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@ves.ac.in',
    password: process.env.ADMIN_PASSWORD || 'change-me-admin',
    name: 'VESIT Admin'
  },
  seller: {
    email: 'rahul.sharma@ves.ac.in',
    password: 'Password123',
    name: 'Rahul Sharma'
  },
  bidder: {
    email: 'priya.patel@ves.ac.in',
    password: 'Password123',
    name: 'Priya Patel'
  },
  student: {
    email: 'aditya.verma@ves.ac.in',
    password: 'Password123',
    name: 'Aditya Verma'
  },
  suspended: {
    email: 'sneha.k@ves.ac.in',
    password: 'Password123',
    name: 'Sneha Kulkarni'
  }
};

export const getApiUrl = (baseURL = 'http://localhost:5173') => {
  if (process.env.E2E_API_URL) {
    return process.env.E2E_API_URL;
  }
  // In local test runner, server runs on 5001
  return baseURL.includes('5173') ? 'http://localhost:5001/api/v1' : `${baseURL}/api/v1`;
};

/**
 * Resets the test database by executing the seed script against MONGO_URI_TEST
 */
export const resetDb = () => {
  const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/campusbid_test';
  execSync('node src/scripts/seed.js', {
    cwd: path.resolve(rootDir, 'server'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      MONGO_URI: mongoUri,
      ADMIN_PASSWORD: 'change-me-admin'
    },
    stdio: 'ignore'
  });
};

/**
 * Logs in via REST API and injects the campusbid_token into page localStorage
 */
export const loginAs = async (page, role = 'student', baseURL = 'http://localhost:5173') => {
  const account = ACCOUNTS[role] || ACCOUNTS.student;
  const apiUrl = getApiUrl(baseURL);

  const res = await page.request.post(`${apiUrl}/auth/login`, {
    data: {
      email: account.email,
      password: account.password
    }
  });

  const body = await res.json();
  if (!body.success || !body.token) {
    throw new Error(`Login helper failed for ${account.email}: ${JSON.stringify(body)}`);
  }

  // Navigate to page origin if not already there, then set token in localStorage
  await page.goto('/');
  await page.evaluate(({ token }) => {
    localStorage.setItem('campusbid_token', token);
  }, { token: body.token });

  await page.reload();
  await page.waitForSelector('[data-testid="nav-profile-link"]');
  return { token: body.token, user: body.user };
};

/**
 * Places a bid directly via the REST API using a user token
 */
export const bidViaApi = async (request, token, productId, amount, baseURL = 'http://localhost:5173') => {
  const apiUrl = getApiUrl(baseURL);
  const res = await request.post(`${apiUrl}/products/${productId}/bids`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      amount: Number(amount)
    }
  });
  return await res.json();
};
