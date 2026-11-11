import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import { generateToken } from '../src/controllers/authController.js';
import { uploadsDir } from '../src/middleware/upload.js';

describe('Image Upload API Tests', () => {
  let student = null;
  let studentToken = '';
  const uploadedFilesToCleanup = [];

  // Valid 1x1 PNG bytes
  const validPngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d400000000049454e44ae426082',
    'hex'
  );

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    student = await User.create({
      fullName: 'Upload Student',
      email: 'upload.student@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    studentToken = generateToken(student);
  });

  after(async () => {
    await User.deleteMany({ email: 'upload.student@ves.ac.in' });
    // Clean up any test files created in uploadsDir
    for (const file of uploadedFilesToCleanup) {
      const p = path.join(uploadsDir, file);
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch {}
      }
    }
    await disconnectDB();
  });

  it('1. Rejects unauthenticated upload request (401)', async () => {
    const res = await request(app)
      .post('/api/v1/uploads')
      .attach('images', validPngBuffer, 'test.png');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('2. Rejects a text file (400 INVALID_FILE_TYPE)', async () => {
    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('images', Buffer.from('plain text content'), {
        filename: 'notes.txt',
        contentType: 'text/plain'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_FILE_TYPE');
  });

  it('3. Rejects an oversized file > 5MB (400 FILE_TOO_LARGE)', async () => {
    // 5.2 MB payload
    const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024);

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('images', oversizedBuffer, {
        filename: 'huge_image.png',
        contentType: 'image/png'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FILE_TOO_LARGE');
  });

  it('4. Accepts small valid PNG and returns URL (201 Created)', async () => {
    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('images', validPngBuffer, {
        filename: 'sample_icon.png',
        contentType: 'image/png'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.urls));
    assert.equal(res.body.urls.length, 1);
    assert.ok(res.body.urls[0].startsWith('/uploads/img-'));

    const filename = path.basename(res.body.urls[0]);
    uploadedFilesToCleanup.push(filename);

    // Verify static serving of the uploaded file
    const getRes = await request(app).get(res.body.urls[0]);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.headers['content-type'], 'image/png');
  });
});
