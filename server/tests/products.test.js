import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import { generateToken } from '../src/controllers/authController.js';

describe('Products & Listings API Tests', () => {
  let sellerToken = '';
  let otherSellerToken = '';
  let adminToken = '';
  let sellerUser = null;
  let otherSellerUser = null;
  let adminUser = null;
  let liveProduct = null;
  let draftProduct = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Create users
    sellerUser = await User.create({
      fullName: 'Product Seller',
      email: 'prod.seller@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    sellerToken = generateToken(sellerUser);

    otherSellerUser = await User.create({
      fullName: 'Other Seller',
      email: 'other.seller@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    otherSellerToken = generateToken(otherSellerUser);

    adminUser = await User.create({
      fullName: 'Admin User',
      email: 'prod.admin@ves.ac.in',
      passwordHash: 'hash123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // Create a live product
    liveProduct = await Product.create({
      title: 'Arduino Robotics Starter Kit',
      category: 'electronics',
      condition: 'like-new',
      description: 'Used for semester 4 microcontrollers mini project',
      seller: sellerUser._id,
      startingBid: 1000,
      currentBid: 1000,
      minIncrement: 100,
      status: 'live',
      duration: '3d',
      endTime: new Date(Date.now() + 3 * 24 * 3600 * 1000)
    });

    // Create a draft product
    draftProduct = await Product.create({
      title: 'Analog Communication Textbook',
      category: 'books',
      condition: 'good',
      description: 'Standard textbook for EXTC second year',
      seller: sellerUser._id,
      startingBid: 400,
      currentBid: 400,
      minIncrement: 50,
      status: 'draft',
      duration: '3d'
    });
  });

  after(async () => {
    await User.deleteMany({
      email: { $in: ['prod.seller@ves.ac.in', 'other.seller@ves.ac.in', 'prod.admin@ves.ac.in'] }
    });
    await Product.deleteMany({ seller: { $in: [sellerUser._id, otherSellerUser._id] } });
    await disconnectDB();
  });

  it('1. GET /api/v1/products - public catalog returns live products with pagination', async () => {
    const res = await request(app).get('/api/v1/products');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.products));
    assert.ok(res.body.total >= 1);
    assert.ok(res.body.page >= 1);
    assert.ok(res.body.pages >= 1);

    // Ensure drafts are not exposed in public catalog
    const hasDraft = res.body.products.some((p) => p.status === 'draft');
    assert.equal(hasDraft, false);
  });

  it('2. GET /api/v1/products - filters by category and search keyword', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .query({ category: 'electronics', search: 'Arduino' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.products.length >= 1);
    assert.ok(res.body.products.every((p) => p.category === 'electronics'));
  });

  it('3. GET /api/v1/products/:id - returns product details with seller info', async () => {
    const res = await request(app).get(`/api/v1/products/${liveProduct.id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.product.id, liveProduct.id);
    assert.equal(res.body.product.title, 'Arduino Robotics Starter Kit');
    assert.ok(res.body.product.seller);
    assert.equal(res.body.product.seller.name, 'Product Seller');
    assert.ok(Array.isArray(res.body.recentBids));
  });

  it('4. POST /api/v1/products - creates new product listing (defaults to pending_approval)', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Casio fx-991EX Scientific Calculator',
        category: 'electronics',
        condition: 'like-new',
        description: 'Approved non-programmable calculator for university examinations',
        startingBid: 800,
        minIncrement: 50,
        duration: '3d',
        images: ['https://images.unsplash.com/photo-test']
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.product.status, 'pending_approval');
    assert.equal(res.body.product.startingBid, 800);
    assert.equal(res.body.product.currentBid, 800);
  });

  it('5. POST /api/v1/products - creates draft listing when isDraft is true', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Draft EXTC Lab Manual',
        category: 'books',
        condition: 'good',
        description: 'Complete verified lab manual',
        startingBid: 150,
        minIncrement: 20,
        duration: '24h',
        isDraft: true
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.product.status, 'draft');
  });

  it('6. GET /api/v1/products/mine - returns authenticated user listings including drafts', async () => {
    const res = await request(app)
      .get('/api/v1/products/mine')
      .set('Authorization', `Bearer ${sellerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.products.length >= 2);
    const statuses = res.body.products.map((p) => p.status);
    assert.ok(statuses.includes('draft'));
  });

  it('7. PUT /api/v1/products/:id - owner can update product when bidCount is 0', async () => {
    const res = await request(app)
      .put(`/api/v1/products/${liveProduct.id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Arduino Robotics Starter Kit (With Extras)',
        description: 'Now including additional motor driver shield'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.product.title, 'Arduino Robotics Starter Kit (With Extras)');
  });

  it('8. PUT /api/v1/products/:id - non-owner cannot edit listing (403 FORBIDDEN_OWNER_ONLY)', async () => {
    const res = await request(app)
      .put(`/api/v1/products/${liveProduct.id}`)
      .set('Authorization', `Bearer ${otherSellerToken}`)
      .send({
        title: 'Malicious Hijacked Title'
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN_OWNER_ONLY');
  });

  it('9. POST /api/v1/products/:id/publish - owner publishes draft to pending_approval', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${draftProduct.id}/publish`)
      .set('Authorization', `Bearer ${sellerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.product.status, 'pending_approval');
  });

  it('10. POST /api/v1/products/:id/report - student can report product listing', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${liveProduct.id}/report`)
      .set('Authorization', `Bearer ${otherSellerToken}`)
      .send({
        reason: 'Suspected missing parts not disclosed in listing.'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.report.id);
  });

  it('11. DELETE /api/v1/products/:id - soft deletes listing', async () => {
    const res = await request(app)
      .delete(`/api/v1/products/${draftProduct.id}`)
      .set('Authorization', `Bearer ${sellerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify it is now 404 when looked up
    const lookup = await request(app).get(`/api/v1/products/${draftProduct.id}`);
    assert.equal(lookup.status, 404);
  });
});
