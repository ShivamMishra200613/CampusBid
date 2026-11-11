import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Notification from '../src/models/Notification.js';
import { closeExpiredAuctions } from '../src/services/auctionCloser.js';

describe('Auction Lifecycle & Sweeper Tests', () => {
  let seller = null;
  let bidder = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    seller = await User.create({
      fullName: 'Sweeper Seller',
      email: 'sweeper.seller@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });

    bidder = await User.create({
      fullName: 'Sweeper Winning Bidder',
      email: 'sweeper.bidder@ves.ac.in',
      passwordHash: 'hash123',
      role: 'student'
    });
  });

  after(async () => {
    await User.deleteMany({ email: { $in: ['sweeper.seller@ves.ac.in', 'sweeper.bidder@ves.ac.in'] } });
    await Product.deleteMany({ seller: seller._id });
    await Notification.deleteMany({});
    await disconnectDB();
  });

  it('1. Closes expired auction with winner and sends notifications to winner and seller', async () => {
    // Create product ending in 400ms
    const product = await Product.create({
      title: 'Short Duration Arduino Shield',
      category: 'electronics',
      condition: 'new',
      description: 'Used for automated test closing',
      seller: seller._id,
      startingBid: 800,
      currentBid: 1200,
      minIncrement: 50,
      bidCount: 3,
      highestBidder: bidder._id,
      status: 'live',
      duration: '24h',
      endTime: new Date(Date.now() + 400)
    });

    // Wait until auction time passes
    await new Promise((resolve) => setTimeout(resolve, 550));

    // Run sweeper directly
    const closed = await closeExpiredAuctions();

    assert.ok(closed.length >= 1);
    const target = closed.find((p) => p.id === product.id);
    assert.ok(target, 'Target product should be returned in closed list');
    assert.equal(target.status, 'ended');
    assert.equal(target.winner.toString(), bidder._id.toString());

    // Verify database record
    const dbProduct = await Product.findById(product.id);
    assert.equal(dbProduct.status, 'ended');
    assert.equal(dbProduct.winner.toString(), bidder._id.toString());

    // Verify winner notification
    const winnerNotif = await Notification.findOne({
      user: bidder._id,
      type: 'auction_won',
      product: product._id
    });
    assert.ok(winnerNotif);
    assert.equal(winnerNotif.title, 'Congratulations! You won the auction!');
    assert.ok(winnerNotif.message.includes('1,200'));

    // Verify seller notification
    const sellerNotif = await Notification.findOne({
      user: seller._id,
      type: 'auction_ended',
      product: product._id
    });
    assert.ok(sellerNotif);
    assert.equal(sellerNotif.title, 'Auction Ended with Winning Bid');
    assert.ok(sellerNotif.message.includes('1,200'));
    assert.ok(sellerNotif.message.includes('Sweeper Winning Bidder'));
  });

  it('2. Sweeper is idempotent and safe to run multiple times', async () => {
    const notifsBefore = await Notification.countDocuments();

    // Run sweeper immediately again
    const secondPass = await closeExpiredAuctions();

    // Already ended auctions must not be re-closed
    assert.equal(secondPass.length, 0);

    const notifsAfter = await Notification.countDocuments();
    assert.equal(notifsBefore, notifsAfter, 'No duplicate notifications should be created');
  });

  it('3. Closes expired auction with no bids and notifies seller without winner', async () => {
    const noBidProduct = await Product.create({
      title: 'Unpopular Textbook',
      category: 'books',
      condition: 'good',
      description: 'Nobody bid on this item',
      seller: seller._id,
      startingBid: 200,
      currentBid: 200,
      minIncrement: 20,
      bidCount: 0,
      highestBidder: null,
      status: 'live',
      duration: '24h',
      endTime: new Date(Date.now() - 500) // Already expired
    });

    const closed = await closeExpiredAuctions();
    const target = closed.find((p) => p.id === noBidProduct.id);
    assert.ok(target);
    assert.equal(target.status, 'ended');
    assert.equal(target.winner, null);

    // Verify seller received "No Bids" notification
    const sellerNotif = await Notification.findOne({
      user: seller._id,
      type: 'auction_ended',
      product: noBidProduct._id
    });
    assert.ok(sellerNotif);
    assert.equal(sellerNotif.title, 'Auction Ended - No Bids');
    assert.ok(sellerNotif.message.includes('no bids placed'));
  });

  it('4. Leaves future live auctions untouched', async () => {
    const futureProduct = await Product.create({
      title: 'Future Ending Item',
      category: 'electronics',
      condition: 'like-new',
      description: 'Ends tomorrow',
      seller: seller._id,
      startingBid: 1000,
      currentBid: 1000,
      minIncrement: 50,
      status: 'live',
      duration: '24h',
      endTime: new Date(Date.now() + 3600000)
    });

    const closed = await closeExpiredAuctions();
    assert.ok(!closed.some((p) => p.id === futureProduct.id));

    const check = await Product.findById(futureProduct.id);
    assert.equal(check.status, 'live');
  });
});
