import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Bid from '../src/models/Bid.js';
import Notification from '../src/models/Notification.js';
import { generateToken } from '../src/controllers/authController.js';

describe('Bidding System API Tests & Concurrency Verification', () => {
  let seller = null;
  let sellerToken = '';
  let bidders = []; // 10 distinct bidder users
  let bidderTokens = [];

  let liveProduct = null;
  let endedProduct = null;
  let draftProduct = null;
  let concurrencyProduct = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Create seller
    seller = await User.create({
      fullName: 'Auction Seller',
      email: 'bid.seller@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
    sellerToken = generateToken(seller);

    // Create 10 distinct bidders for concurrent testing
    bidders = [];
    bidderTokens = [];
    for (let i = 1; i <= 10; i++) {
      const b = await User.create({
        fullName: `Bidder Student ${i}`,
        email: `bidder${i}@ves.ac.in`,
        passwordHash: 'hash123',
        role: 'student'
      });
      bidders.push(b);
      bidderTokens.push(generateToken(b));
    }

    // Create standard test products
    liveProduct = await Product.create({
      title: 'Raspberry Pi 4 Model B (4GB)',
      category: 'electronics',
      condition: 'like-new',
      description: 'Used for embedded systems project, pristine condition.',
      seller: seller._id,
      startingBid: 2500,
      currentBid: 2500,
      minIncrement: 100,
      status: 'live',
      duration: '3d',
      endTime: new Date(Date.now() + 3 * 24 * 3600 * 1000)
    });

    endedProduct = await Product.create({
      title: 'Expired Mechanical Keyboard',
      category: 'electronics',
      condition: 'good',
      description: 'Auction has completed.',
      seller: seller._id,
      startingBid: 1500,
      currentBid: 1500,
      minIncrement: 100,
      status: 'live', // still marked live but endTime is in the past
      duration: '24h',
      endTime: new Date(Date.now() - 10000)
    });

    draftProduct = await Product.create({
      title: 'Draft Soldering Station',
      category: 'electronics',
      condition: 'new',
      description: 'Unpublished draft item.',
      seller: seller._id,
      startingBid: 800,
      currentBid: 800,
      minIncrement: 50,
      status: 'draft',
      duration: '3d'
    });

    // Auction for concurrency race test
    concurrencyProduct = await Product.create({
      title: 'Concurreny Test Scientific Instrument',
      category: 'electronics',
      condition: 'like-new',
      description: 'Special listing to verify atomic findOneAndUpdate race prevention',
      seller: seller._id,
      startingBid: 5000,
      currentBid: 5000,
      minIncrement: 200,
      status: 'live',
      duration: '3d',
      endTime: new Date(Date.now() + 3 * 24 * 3600 * 1000)
    });
  });

  after(async () => {
    await User.deleteMany({ email: { $in: ['bid.seller@ves.ac.in', ...bidders.map((b) => b.email)] } });
    await Product.deleteMany({ seller: seller._id });
    await Bid.deleteMany({});
    await Notification.deleteMany({});
    await disconnectDB();
  });

  it('1. Rejects bid on non-live listing (400 AUCTION_NOT_ACTIVE)', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${draftProduct.id}/bids`)
      .set('Authorization', `Bearer ${bidderTokens[0]}`)
      .send({ amount: 900 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUCTION_NOT_ACTIVE');
  });

  it('2. Rejects bid when auction endTime has elapsed (400 AUCTION_ENDED)', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${endedProduct.id}/bids`)
      .set('Authorization', `Bearer ${bidderTokens[0]}`)
      .send({ amount: 1700 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUCTION_ENDED');
  });

  it('3. Rejects bid below currentBid + minIncrement (400 BID_TOO_LOW)', async () => {
    // Current bid: 2500, min increment: 100 => min required: 2600
    const res = await request(app)
      .post(`/api/v1/products/${liveProduct.id}/bids`)
      .set('Authorization', `Bearer ${bidderTokens[0]}`)
      .send({ amount: 2550 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'BID_TOO_LOW');
  });

  it('4. Rejects seller bidding on own listing (403 BID_ON_OWN_LISTING)', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${liveProduct.id}/bids`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 2600 });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'BID_ON_OWN_LISTING');
  });

  it('5. Successfully places valid bid (201 Created) and updates product state', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${liveProduct.id}/bids`)
      .set('Authorization', `Bearer ${bidderTokens[0]}`)
      .send({ amount: 2600 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.updatedCurrentBid, 2600);
    assert.equal(res.body.bid.amount, 2600);
    assert.equal(res.body.bid.bidderId, bidders[0].id);

    // Verify DB product state
    const updated = await Product.findById(liveProduct.id);
    assert.equal(updated.currentBid, 2600);
    assert.equal(updated.bidCount, 1);
    assert.equal(updated.highestBidder.toString(), bidders[0].id);
  });

  it('6. Places higher bid and notifies previous highest bidder', async () => {
    // Bidder 1 was highest at 2600. Bidder 2 now bids 2750.
    const res = await request(app)
      .post(`/api/v1/products/${liveProduct.id}/bids`)
      .set('Authorization', `Bearer ${bidderTokens[1]}`)
      .send({ amount: 2750 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.updatedCurrentBid, 2750);

    // Verify outbid notification was generated for Bidder 1
    const notif = await Notification.findOne({
      user: bidders[0]._id,
      type: 'outbid'
    });
    assert.ok(notif);
    assert.equal(notif.title, 'You were outbid!');
    assert.ok(notif.message.includes('2,750'));
  });

  it('7. Concurrency Test: 10 simultaneous bids at the same price - exactly one succeeds', async () => {
    // concurrencyProduct: startingBid 5000, minIncrement 200 => next required bid is 5200.
    // 10 distinct students simultaneously submit 5200
    const bidAmount = 5200;

    const promises = bidderTokens.map((token) =>
      request(app)
        .post(`/api/v1/products/${concurrencyProduct.id}/bids`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: bidAmount })
    );

    const responses = await Promise.all(promises);

    const successResponses = responses.filter((r) => r.status === 201);
    const failureResponses = responses.filter((r) => r.status === 400);

    assert.equal(
      successResponses.length,
      1,
      `Expected exactly 1 successful bid, got ${successResponses.length}`
    );
    assert.equal(
      failureResponses.length,
      9,
      `Expected 9 failed bids, got ${failureResponses.length}`
    );

    // Check error code on rejected bids (either caught by atomic filter as BID_OUTDATED or pre-check as BID_TOO_LOW)
    failureResponses.forEach((r) => {
      assert.equal(r.body.success, false);
      assert.ok(
        ['BID_OUTDATED', 'BID_TOO_LOW'].includes(r.body.error.code),
        `Expected BID_OUTDATED or BID_TOO_LOW, got ${r.body.error.code}`
      );
    });

    // Check database consistency: currentBid must be 5200 and bidCount must be 1
    const finalProduct = await Product.findById(concurrencyProduct.id);
    assert.equal(finalProduct.currentBid, 5200);
    assert.equal(finalProduct.bidCount, 1);

    const recordedBids = await Bid.find({ product: concurrencyProduct.id });
    assert.equal(recordedBids.length, 1);
  });

  it('8. GET /api/v1/products/:id/bids - returns paginated bid history', async () => {
    const res = await request(app).get(`/api/v1/products/${liveProduct.id}/bids`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.total, 2); // 2600 by Bidder 1, 2750 by Bidder 2
    assert.equal(res.body.bids.length, 2);
    assert.equal(res.body.bids[0].amount, 2750); // Most recent first
  });

  it('9. GET /api/v1/bids/my-bids - returns user bid history with accurate statuses', async () => {
    // Bidder 2 is currently winning liveProduct at 2750
    const resWinning = await request(app)
      .get('/api/v1/bids/my-bids')
      .set('Authorization', `Bearer ${bidderTokens[1]}`);

    assert.equal(resWinning.status, 200);
    assert.equal(resWinning.body.success, true);
    assert.ok(resWinning.body.bids.length >= 1);
    const winningItem = resWinning.body.bids.find((b) => b.productId === liveProduct.id);
    assert.ok(winningItem);
    assert.equal(winningItem.status, 'Winning');

    // Bidder 1 was outbid
    const resOutbid = await request(app)
      .get('/api/v1/bids/my-bids')
      .set('Authorization', `Bearer ${bidderTokens[0]}`);

    assert.equal(resOutbid.status, 200);
    const outbidItem = resOutbid.body.bids.find((b) => b.productId === liveProduct.id);
    assert.ok(outbidItem);
    assert.equal(outbidItem.status, 'Outbid');
  });
});
