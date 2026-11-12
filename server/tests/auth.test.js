import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';

describe('Authentication & Authorization API Tests', () => {
  let studentToken = '';
  let otherStudentToken = '';
  let adminToken = '';
  let studentUser = null;
  let otherStudentUser = null;
  let adminUser = null;
  let studentListing = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clean only test accounts used in this suite
    await User.deleteMany({
      email: { $in: ['test.student@ves.ac.in', 'other.student@ves.ac.in', 'outsider@gmail.com'] }
    });
    await Product.deleteMany({ title: 'Student Test Listing' });
  });

  after(async () => {
    await User.deleteMany({
      email: { $in: ['test.student@ves.ac.in', 'other.student@ves.ac.in'] }
    });
    await Product.deleteMany({ title: 'Student Test Listing' });
    await disconnectDB();
  });

  it('1. POST /api/v1/auth/register - successfully registers student with @ves.ac.in', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Test Student',
      email: 'test.student@ves.ac.in',
      password: 'Password123',
      classBranch: 'D12C / CMPN',
      rollNo: '101',
      role: 'admin' // Attempt privilege escalation, should be ignored
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'test.student@ves.ac.in');
    assert.equal(res.body.user.role, 'student'); // Enforced as student
    assert.equal(res.body.user.passwordHash, undefined);

    studentToken = res.body.token;
    studentUser = res.body.user;
  });

  it('2. POST /api/v1/auth/register - rejects duplicate email with 409 USER_ALREADY_EXISTS', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Duplicate Student',
      email: 'test.student@ves.ac.in',
      password: 'Password123'
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'USER_ALREADY_EXISTS');
  });

  it('3. POST /api/v1/auth/login - succeeds with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test.student@ves.ac.in',
      password: 'Password123'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'test.student@ves.ac.in');
  });

  it('4. POST /api/v1/auth/login - rejects wrong password with 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test.student@ves.ac.in',
      password: 'WrongPassword999'
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  it('5. GET /api/v1/users/me - access without token returns 401', async () => {
    const res = await request(app).get('/api/v1/users/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('6. GET /api/v1/admin/stats - student token on admin route returns 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN_ADMIN_ONLY');
  });

  it('7. PUT /api/v1/products/:id - student editing another users listing returns 403', async () => {
    // Register another student
    const regOther = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Other Student',
      email: 'other.student@ves.ac.in',
      password: 'Password123'
    });

    otherStudentToken = regOther.body.token;
    otherStudentUser = regOther.body.user;

    // Create a listing owned by first student
    studentListing = await Product.create({
      title: 'Original Student Laptop',
      category: 'electronics',
      condition: 'good',
      description: 'Listed by test student',
      seller: studentUser.id,
      startingBid: 20000,
      currentBid: 20000,
      minIncrement: 500,
      status: 'live'
    });

    // Other student tries to edit it
    const res = await request(app)
      .put(`/api/v1/products/${studentListing.id}`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({
        title: 'Hacked Title By Other Student'
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN_OWNER_ONLY');
  });
});
