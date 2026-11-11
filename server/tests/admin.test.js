import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Report from '../src/models/Report.js';
import Notification from '../src/models/Notification.js';
import { generateToken } from '../src/controllers/authController.js';

describe('Admin Management API Tests', () => {
  let admin = null;
  let adminToken = '';
  let otherAdmin = null;
  let otherAdminToken = '';
  let student = null;
  let studentToken = '';

  let pendingProduct = null;
  let reportTargetProduct = null;
  let testReport = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    admin = await User.create({
      fullName: 'Super Admin',
      email: 'admin.test@ves.ac.in',
      passwordHash: 'hash123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    otherAdmin = await User.create({
      fullName: 'Second Admin',
      email: 'admin2.test@ves.ac.in',
      passwordHash: 'hash123',
      role: 'admin'
    });
    otherAdminToken = generateToken(otherAdmin);

    student = await User.create({
      fullName: 'Regular Student',
      email: 'student.admin.test@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    studentToken = generateToken(student);

    pendingProduct = await Product.create({
      title: 'Pending Approval Graphic Tablet',
      category: 'electronics',
      condition: 'like-new',
      description: 'Waiting for admin approval',
      seller: student._id,
      startingBid: 3000,
      currentBid: 3000,
      minIncrement: 100,
      status: 'pending_approval',
      duration: '3d'
    });

    reportTargetProduct = await Product.create({
      title: 'Flagged Item for Reporting',
      category: 'others',
      condition: 'fair',
      description: 'Reported item under investigation',
      seller: student._id,
      startingBid: 500,
      currentBid: 500,
      minIncrement: 50,
      status: 'live',
      duration: '24h',
      endTime: new Date(Date.now() + 86400000)
    });

    testReport = await Report.create({
      product: reportTargetProduct._id,
      reportedBy: admin._id,
      reason: 'Violates campus policy'
    });
  });

  after(async () => {
    await User.deleteMany({
      email: {
        $in: ['admin.test@ves.ac.in', 'admin2.test@ves.ac.in', 'student.admin.test@ves.ac.in']
      }
    });
    await Product.deleteMany({ seller: student._id });
    await Report.deleteMany({ _id: testReport._id });
    await Notification.deleteMany({ user: student._id });
    await disconnectDB();
  });

  it('1. GET /api/v1/admin/stats - returns platform analytics numbers', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.stats.activeUsers === 'number');
    assert.ok(typeof res.body.stats.totalVolumeInr === 'number');
    assert.ok(typeof res.body.stats.pendingApprovals === 'number');
    assert.ok(typeof res.body.stats.flaggedListings === 'number');
  });

  it('2. GET /api/v1/admin/listings/pending - returns pending listings queue', async () => {
    const res = await request(app)
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.listings));
    const found = res.body.listings.find((p) => p.id === pendingProduct.id);
    assert.ok(found);
  });

  it('3. POST /api/v1/admin/listings/:id/moderate - approves listing and makes it live', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/listings/${pendingProduct.id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.product.status, 'live');
    assert.ok(res.body.product.endTime);

    // Verify notification was sent to student
    const notif = await Notification.findOne({
      user: student._id,
      type: 'listing_approved'
    });
    assert.ok(notif);
  });

  it('4. POST /api/v1/admin/listings/:id/moderate - rejects listing with reason', async () => {
    const toReject = await Product.create({
      title: 'Item To Reject',
      category: 'others',
      condition: 'fair',
      description: 'Will be rejected by moderator',
      seller: student._id,
      startingBid: 200,
      minIncrement: 20,
      status: 'pending_approval',
      duration: '24h'
    });

    const res = await request(app)
      .post(`/api/v1/admin/listings/${toReject.id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'reject',
        reason: 'Prohibited commercial advertising.'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.product.status, 'removed');
    assert.equal(res.body.product.rejectionReason, 'Prohibited commercial advertising.');
  });

  it('5. GET /api/v1/admin/reports - returns flagged reports queue', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.reports));
    assert.ok(res.body.reports.some((r) => r.id === testReport.id));
  });

  it('6. POST /api/v1/admin/reports/:id/resolve - resolves report with remove_listing', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/reports/${testReport.id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolutionAction: 'remove_listing',
        notes: 'Confirmed prohibited item, listing removed.'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.report.status, 'resolved');
    assert.equal(res.body.report.resolutionAction, 'remove_listing');

    // Verify target product status is now 'removed'
    const updatedProd = await Product.findById(reportTargetProduct.id);
    assert.equal(updatedProd.status, 'removed');
  });

  it('7. GET /api/v1/admin/users - lists users with search and pagination', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .query({ search: 'Regular Student' })
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.users.length >= 1);
    assert.equal(res.body.users[0].email, 'student.admin.test@ves.ac.in');
  });

  it('8. PATCH /api/v1/admin/users/:id/suspend - prevents admin from suspending self', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${admin.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'CANNOT_SUSPEND_SELF');
  });

  it('9. PATCH /api/v1/admin/users/:id/suspend - prevents admin from suspending another admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${otherAdmin.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'CANNOT_SUSPEND_ADMIN');
  });

  it('10. PATCH /api/v1/admin/users/:id/suspend - successfully suspends student account', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${student.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.isSuspended, true);

    const checkUser = await User.findById(student.id);
    assert.equal(checkUser.isSuspended, true);
  });

  it('11. PATCH /api/v1/admin/users/:id/unsuspend - reactivates suspended student account', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${student.id}/unsuspend`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.isSuspended, false);

    const checkUser = await User.findById(student.id);
    assert.equal(checkUser.isSuspended, false);
  });
});
