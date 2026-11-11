import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import request from 'supertest';
import { io as ioClient } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { initSockets, getIO } from '../src/sockets/index.js';
import { config } from '../src/config/config.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Bid from '../src/models/Bid.js';
import Notification from '../src/models/Notification.js';

describe('Real-Time Socket.IO Tests', () => {
  let server;
  let serverUrl;
  let seller;
  let buyerA;
  let buyerB;
  let tokenA;
  let tokenB;
  let product;

  before(async () => {
    await connectDB();

    // Clean up any leftovers
    await User.deleteMany({ email: { $in: ['sock.seller@ves.ac.in', 'sock.buyera@ves.ac.in', 'sock.buyerb@ves.ac.in'] } });

    seller = await User.create({
      fullName: 'Socket Seller',
      email: 'sock.seller@ves.ac.in',
      passwordHash: 'dummy',
      role: 'student',
      classBranch: 'D12C / EXTC',
      rollNo: '2021EXTC090'
    });

    buyerA = await User.create({
      fullName: 'Buyer Alice',
      email: 'sock.buyera@ves.ac.in',
      passwordHash: 'dummy',
      role: 'student',
      classBranch: 'D12C / EXTC',
      rollNo: '2021EXTC091',
      notificationPreferences: { outbidAlerts: true }
    });

    buyerB = await User.create({
      fullName: 'Buyer Bob',
      email: 'sock.buyerb@ves.ac.in',
      passwordHash: 'dummy',
      role: 'student',
      classBranch: 'D12C / EXTC',
      rollNo: '2021EXTC092',
      notificationPreferences: { outbidAlerts: true }
    });

    tokenA = jwt.sign({ sub: buyerA.id, role: buyerA.role }, config.jwtSecret, { expiresIn: '1h' });
    tokenB = jwt.sign({ sub: buyerB.id, role: buyerB.role }, config.jwtSecret, { expiresIn: '1h' });

    product = await Product.create({
      title: 'Socket Realtime Calculus Book',
      description: 'Used textbook for testing Socket.IO live bidding broadcasts.',
      category: 'books',
      condition: 'good',
      startingBid: 500,
      currentBid: 500,
      minIncrement: 50,
      duration: '3d',
      endTime: new Date(Date.now() + 3600000),
      seller: seller.id,
      status: 'live',
      images: ['https://example.com/socket-book.jpg']
    });

    // Start HTTP + Socket server on an ephemeral port
    server = http.createServer(app);
    initSockets(server);

    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        serverUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    const io = getIO();
    if (io) {
      io.close();
    }
    if (server) {
      server.close();
    }
    await Product.deleteMany({ _id: product._id });
    await Bid.deleteMany({ product: product._id });
    await Notification.deleteMany({ user: { $in: [buyerA.id, buyerB.id, seller.id] } });
    await User.deleteMany({ _id: { $in: [seller.id, buyerA.id, buyerB.id] } });
    await disconnectDB();
  });

  test('1. Anonymous client cannot join a user: room', async () => {
    const anonSocket = ioClient(serverUrl, {
      transports: ['websocket'],
      forceNew: true
    });

    await new Promise((resolve) => {
      anonSocket.on('connect', resolve);
    });

    const errorReceived = new Promise((resolve) => {
      anonSocket.on('error', (err) => {
        resolve(err);
      });
      // Try to join private user room as anonymous
      anonSocket.emit('join', `user:${buyerA.id}`);
    });

    const err = await errorReceived;
    assert.equal(err.code, 'UNAUTHORIZED_ROOM');

    anonSocket.disconnect();
  });

  test('2. Two clients join the same auction room and receive viewer count updates', async () => {
    const socketA = ioClient(serverUrl, {
      auth: { token: tokenA },
      transports: ['websocket'],
      forceNew: true
    });

    const socketB = ioClient(serverUrl, {
      auth: { token: tokenB },
      transports: ['websocket'],
      forceNew: true
    });

    await Promise.all([
      new Promise((res) => socketA.on('connect', res)),
      new Promise((res) => socketB.on('connect', res))
    ]);

    // Join room
    const viewersUpdateB = new Promise((res) => {
      socketB.on('auction:viewers', (data) => {
        if (data.productId === product.id && data.viewerCount >= 1) {
          res(data);
        }
      });
    });

    socketA.emit('auction:join', product.id);
    socketB.emit('auction:join', product.id);

    const viewerData = await viewersUpdateB;
    assert.equal(viewerData.productId, product.id);
    assert.ok(viewerData.viewerCount >= 1);

    socketA.disconnect();
    socketB.disconnect();
  });

  test('3. One client bids over REST; both clients receive bid:new with updated bid and bidder info', async () => {
    const socketA = ioClient(serverUrl, {
      auth: { token: tokenA },
      transports: ['websocket'],
      forceNew: true
    });

    const socketB = ioClient(serverUrl, {
      auth: { token: tokenB },
      transports: ['websocket'],
      forceNew: true
    });

    await Promise.all([
      new Promise((res) => socketA.on('connect', res)),
      new Promise((res) => socketB.on('connect', res))
    ]);

    socketA.emit('auction:join', product.id);
    socketB.emit('auction:join', product.id);

    // Prepare promises for bid:new on both clients
    const eventReceivedA = new Promise((res) => {
      socketA.on('bid:new', (data) => res(data));
    });
    const eventReceivedB = new Promise((res) => {
      socketB.on('bid:new', (data) => res(data));
    });

    // Buyer A places bid over REST API
    const res = await request(app)
      .post(`/api/v1/products/${product.id}/bids`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 600 });

    assert.equal(res.status, 201);

    const [dataA, dataB] = await Promise.all([eventReceivedA, eventReceivedB]);

    assert.equal(dataA.productId, product.id);
    assert.equal(dataA.currentBid, 600);
    assert.equal(dataA.bid.amount, 600);
    assert.equal(dataA.bid.bidderName, 'Buyer Alice');

    assert.equal(dataB.productId, product.id);
    assert.equal(dataB.currentBid, 600);
    assert.equal(dataB.bid.amount, 600);

    socketA.disconnect();
    socketB.disconnect();
  });

  test('4. Higher bid by Buyer B triggers instant notification:new in Buyer A private room', async () => {
    const socketA = ioClient(serverUrl, {
      auth: { token: tokenA },
      transports: ['websocket'],
      forceNew: true
    });

    await new Promise((res) => socketA.on('connect', res));

    // Listen for real-time notification on Buyer A
    const outbidNotifPromise = new Promise((res) => {
      socketA.on('notification:new', (notif) => {
        if (notif.type === 'outbid') {
          res(notif);
        }
      });
    });

    // Buyer B places higher bid over REST
    const res = await request(app)
      .post(`/api/v1/products/${product.id}/bids`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 700 });

    assert.equal(res.status, 201);

    const receivedNotif = await outbidNotifPromise;
    assert.equal(receivedNotif.type, 'outbid');
    assert.ok(receivedNotif.message.includes('Buyer Bob'));
    assert.ok(receivedNotif.message.includes('700'));

    socketA.disconnect();
  });
});
