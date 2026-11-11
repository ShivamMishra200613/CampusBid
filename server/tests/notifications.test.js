import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Notification from '../src/models/Notification.js';
import { generateToken } from '../src/controllers/authController.js';

describe('Notifications API Tests', () => {
  let student = null;
  let studentToken = '';
  let otherStudent = null;
  let otherStudentToken = '';

  let notif1 = null;
  let notif2 = null;
  let otherNotif = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    student = await User.create({
      fullName: 'Notif Student',
      email: 'notif.student@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    studentToken = generateToken(student);

    otherStudent = await User.create({
      fullName: 'Other Notif Student',
      email: 'other.notif@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    otherStudentToken = generateToken(otherStudent);

    notif1 = await Notification.create({
      user: student._id,
      type: 'outbid',
      title: 'Outbid Alert',
      message: 'You have been outbid on item A',
      read: false
    });

    notif2 = await Notification.create({
      user: student._id,
      type: 'auction_won',
      title: 'Auction Won',
      message: 'You won the auction for item B',
      read: false
    });

    otherNotif = await Notification.create({
      user: otherStudent._id,
      type: 'listing_approved',
      title: 'Approved',
      message: 'Your listing is live',
      read: false
    });
  });

  after(async () => {
    await User.deleteMany({ email: { $in: ['notif.student@ves.ac.in', 'other.notif@ves.ac.in'] } });
    await Notification.deleteMany({});
    await disconnectDB();
  });

  it('1. GET /api/v1/notifications - returns user notifications and unread count', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.unreadCount, 2);
    assert.equal(res.body.notifications.length, 2);
    // Must not contain other user's notification
    assert.ok(!res.body.notifications.some((n) => n.id === otherNotif.id));
  });

  it('2. PATCH /api/v1/notifications/:id/read - marks single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${notif1.id}/read`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.notification.read, true);

    const check = await Notification.findById(notif1.id);
    assert.equal(check.read, true);
  });

  it('3. PATCH /api/v1/notifications/:id/read - rejects marking another users notification (404)', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${otherNotif.id}/read`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('4. PATCH /api/v1/notifications/read-all - marks all user notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const remainingUnread = await Notification.countDocuments({
      user: student._id,
      read: false
    });
    assert.equal(remainingUnread, 0);

    // Other user's notification remains unread
    const otherCheck = await Notification.findById(otherNotif.id);
    assert.equal(otherCheck.read, false);
  });
});
