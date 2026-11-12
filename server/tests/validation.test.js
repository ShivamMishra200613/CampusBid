import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import { generateToken } from '../src/controllers/authController.js';

describe('Data Validation API Tests', () => {
  let studentToken = '';
  let validProductId = '';

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Create a student user for authenticated requests
    const student = await User.create({
      fullName: 'Validation Student',
      email: 'validation.student@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    studentToken = generateToken(student);

    const product = await Product.create({
      title: 'Validation Test Product',
      category: 'electronics',
      condition: 'good',
      description: 'A test product for validation',
      seller: student._id,
      startingBid: 1000,
      currentBid: 1000,
      minIncrement: 50,
      status: 'live'
    });
    validProductId = product.id;
  });

  after(async () => {
    await User.deleteMany({ email: 'validation.student@ves.ac.in' });
    await Product.deleteMany({ title: 'Validation Test Product' });
    await disconnectDB();
  });

  it('1. Bad email domain - rejects non-@ves.ac.in email with 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Outsider User',
      email: 'outsider@gmail.com',
      password: 'ValidPassword123'
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    const emailIssue = res.body.error.details.find((d) => d.field === 'email');
    assert.ok(emailIssue, 'Expected email validation issue in error details');
  });

  it('2. Weak password - rejects password lacking number or < 8 chars with 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Weak Password User',
      email: 'weakpass@ves.ac.in',
      password: 'weak'
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    const passIssue = res.body.error.details.find((d) => d.field === 'password');
    assert.ok(passIssue, 'Expected password validation issue in error details');
  });

  it('3. Missing fields - rejects registration missing required fullName with 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'missingname@ves.ac.in',
      password: 'ValidPassword123'
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    const nameIssue = res.body.error.details.find((d) => d.field === 'fullName');
    assert.ok(nameIssue, 'Expected fullName validation issue in error details');
  });

  it('4. Extra unknown field - rejects unknown fields (.strict()) with 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Strict Test',
      email: 'strict.test@ves.ac.in',
      password: 'ValidPassword123',
      unknownInjectedField: 'malicious_payload'
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    const unknownIssue = res.body.error.details.find(
      (d) =>
        d.message.includes('unrecognized_keys') ||
        d.field.includes('unknownInjectedField') ||
        d.message.includes('Unrecognized key')
    );
    assert.ok(unknownIssue, 'Expected strict unrecognized key error');
  });

  it('5. Negative bid - rejects negative or zero bid with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${validProductId}/bids`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        amount: -500
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    const bidIssue = res.body.error.details.find((d) => d.field === 'amount');
    assert.ok(bidIssue, 'Expected amount validation issue in error details');
  });

  it('6. Invalid ObjectId - rejects malformed ObjectId parameter with 400 INVALID_ID', async () => {
    const res = await request(app).get('/api/v1/products/not-a-valid-object-id-123');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_ID');
  });
});
