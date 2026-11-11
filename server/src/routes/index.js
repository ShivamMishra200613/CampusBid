import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// In-memory mock store for initial contract demonstration & integration testing
export const mockDb = {
  users: [
    {
      id: 'usr_68201',
      fullName: 'Alex Mercer',
      email: 'alex.mercer@ves.ac.in',
      classBranch: 'D12C / EXTC',
      rollNo: '2021EXTC042',
      role: 'student',
      isVerifiedStudent: true,
      phone: '+91 98765 43210',
      bio: 'Engineering student interested in electronics and vintage books. Always looking for reference materials.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      memberSince: 'June 2023',
      stats: { itemsSold: 12, itemsBought: 8, rating: 4.9 },
      notificationPreferences: { outbidAlerts: true, auctionEndingAlerts: true, newMessageAlerts: false }
    },
    {
      id: 'usr_admin',
      fullName: 'VESIT Admin',
      email: 'admin@ves.ac.in',
      classBranch: 'Staff / Administration',
      rollNo: 'STAFF01',
      role: 'admin',
      isVerifiedStudent: true,
      memberSince: 'January 2023',
      stats: { itemsSold: 0, itemsBought: 0, rating: 5.0 }
    }
  ],
  products: [
    {
      id: '1',
      title: 'Bicycle - Firefox Target 21s',
      category: 'sports',
      condition: 'Lightly Used',
      description: 'Well-maintained geared bicycle suitable for campus commuting. Serviced last month.',
      seller: { id: 'usr_alex_v', name: 'Alex V.', isVerified: true, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
      startingBid: 2000,
      currentBid: 2500,
      minIncrement: 100,
      bidCount: 4,
      status: 'live',
      endTime: new Date(Date.now() + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800']
    },
    {
      id: '2',
      title: 'Calculus Early Transcendentals (Stewart)',
      category: 'books',
      condition: 'Like New',
      description: 'Essential reference textbook for engineering semesters. No marks or folded pages.',
      seller: { id: 'usr_oliver', name: 'Oliver B.', isVerified: true, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100' },
      startingBid: 800,
      currentBid: 950,
      minIncrement: 50,
      bidCount: 3,
      status: 'live',
      endTime: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800']
    },
    {
      id: '3',
      title: 'Sony Wireless Noise-Cancelling Headphones',
      category: 'electronics',
      condition: 'Refurbished',
      description: 'Excellent battery life, ANC mode, original box and charging cable included.',
      seller: { id: 'usr_sophia', name: 'Sophia B.', isVerified: true },
      startingBid: 4000,
      currentBid: 4720,
      minIncrement: 100,
      bidCount: 9,
      status: 'ended',
      endTime: new Date(Date.now() - 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      winningBidder: { id: 'usr_68201', name: 'Alex Mercer', amount: 4720 }
    }
  ],
  bids: [
    { id: 'b1', productId: '1', bidderId: 'usr_68201', bidderName: 'Alex Mercer', amount: 2500, createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), timeAgo: '15 mins ago' },
    { id: 'b2', productId: '1', bidderId: 'usr_2', bidderName: 'Marcus H.', amount: 2400, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), timeAgo: '45 mins ago' }
  ],
  notifications: [
    {
      id: 'notif_1',
      userId: 'usr_68201',
      type: 'outbid',
      title: 'You have been outbid!',
      message: 'A higher bid of ₹55.00 was placed on Linear Algebra Textbook.',
      productId: '2',
      read: false,
      createdAt: new Date().toISOString()
    }
  ],
  reports: [
    {
      id: 'rep_1',
      productId: '3',
      productTitle: 'MacBook Pro M1',
      reason: 'Counterfeit',
      status: 'Reviewing',
      reportedBy: 'User_892',
      reportedAt: 'Today, 10:15 AM'
    },
    {
      id: 'rep_2',
      productId: '1',
      productTitle: 'Campus Event Tickets',
      reason: 'Inappropriate Content',
      status: 'Action Required',
      reportedBy: 'User_104',
      reportedAt: 'Yesterday, 4:30 PM'
    }
  ]
};

// -------------------------------------------------------------
// MODULE 1: AUTH & USERS
// -------------------------------------------------------------
router.post('/auth/register', (req, res) => {
  const { fullName, email, classBranch, rollNo, password, agreeTerms } = req.body;
  if (!email || !email.endsWith('@ves.ac.in')) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_EMAIL_DOMAIN', message: 'Only @ves.ac.in email addresses are permitted for registration.' }
    });
  }
  const newUser = {
    id: `usr_${Date.now()}`,
    fullName,
    email,
    classBranch,
    rollNo,
    role: 'student',
    isVerifiedStudent: true,
    memberSince: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    stats: { itemsSold: 0, itemsBought: 0, rating: 5.0 },
    notificationPreferences: { outbidAlerts: true, auctionEndingAlerts: true, newMessageAlerts: true }
  };
  mockDb.users.push(newUser);
  res.status(201).json({
    success: true,
    token: `token_mock_${newUser.id}`,
    user: newUser
  });
});

router.post('/auth/login', (req, res) => {
  const { email } = req.body;
  const user = mockDb.users.find(u => u.email === email) || mockDb.users[0];
  res.json({
    success: true,
    token: `token_mock_${user.id}`,
    user
  });
});

router.get('/users/me', (req, res) => {
  res.json({ success: true, user: mockDb.users[0] });
});

router.put('/users/me', (req, res) => {
  Object.assign(mockDb.users[0], req.body);
  res.json({ success: true, user: mockDb.users[0] });
});

// -------------------------------------------------------------
// MODULE 2, 3 & 5: PRODUCTS & AUCTIONS
// -------------------------------------------------------------
router.get('/products', (req, res) => {
  const { category, status, search } = req.query;
  let items = [...mockDb.products];
  if (category && category !== 'all') {
    items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
  }
  if (status && status !== 'all') {
    items = items.filter(i => i.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  }
  res.json({ success: true, total: items.length, products: items });
});

router.get('/products/:id', (req, res) => {
  const product = mockDb.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }
  const productBids = mockDb.bids.filter(b => b.productId === req.params.id);
  res.json({ success: true, product, recentBids: productBids });
});

router.post('/products', (req, res) => {
  const { title, category, condition, description, startingBid, minIncrement, duration, images } = req.body;
  const durationHours = duration === '24h' ? 24 : duration === '7d' ? 168 : 72;
  const newProduct = {
    id: String(mockDb.products.length + 1),
    title,
    category: category || 'others',
    condition: condition || 'Good',
    description,
    seller: { id: mockDb.users[0].id, name: mockDb.users[0].fullName, isVerified: true, avatar: mockDb.users[0].avatarUrl },
    startingBid: Number(startingBid) || 500,
    currentBid: Number(startingBid) || 500,
    minIncrement: Number(minIncrement) || 50,
    bidCount: 0,
    status: 'live',
    endTime: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']
  };
  mockDb.products.unshift(newProduct);
  res.status(201).json({ success: true, product: newProduct });
});

// -------------------------------------------------------------
// MODULE 4: BIDDING
// -------------------------------------------------------------
router.post('/products/:id/bids', (req, res) => {
  const product = mockDb.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }
  const amount = Number(req.body.amount);
  const minRequired = product.currentBid + product.minIncrement;
  if (amount < minRequired) {
    return res.status(400).json({
      success: false,
      error: { code: 'BID_TOO_LOW', message: `Minimum bid must be at least ₹${minRequired.toLocaleString()}` }
    });
  }
  product.currentBid = amount;
  product.bidCount += 1;

  const newBid = {
    id: `bid_${Date.now()}`,
    productId: product.id,
    bidderId: mockDb.users[0].id,
    bidderName: mockDb.users[0].fullName,
    amount,
    createdAt: new Date().toISOString(),
    timeAgo: 'Just now'
  };
  mockDb.bids.unshift(newBid);

  res.status(201).json({
    success: true,
    message: 'Bid placed successfully!',
    bid: newBid,
    updatedCurrentBid: amount
  });
});

router.get('/bids/my-bids', (req, res) => {
  res.json({
    success: true,
    bids: [
      {
        id: 'b1',
        productId: '1',
        productTitle: 'Bicycle - Firefox Target 21s',
        productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300',
        sellerName: 'Alex V.',
        sellerVerified: true,
        yourBid: 2500,
        highestBid: 2500,
        status: 'Winning',
        timeLeft: '02h : 15m : 45s',
        endTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'b2',
        productId: '2',
        productTitle: 'Linear Algebra Textbook',
        productImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300',
        sellerName: 'Jamie Chen',
        sellerVerified: false,
        yourBid: 450,
        highestBid: 550,
        status: 'Outbid',
        timeLeft: '12h : 45m : 10s',
        endTime: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
      }
    ]
  });
});

// -------------------------------------------------------------
// MODULE 6: NOTIFICATIONS
// -------------------------------------------------------------
router.get('/notifications', (req, res) => {
  res.json({
    success: true,
    unreadCount: mockDb.notifications.filter(n => !n.read).length,
    notifications: mockDb.notifications
  });
});

// -------------------------------------------------------------
// MODULE 7: ADMIN MODULE
// -------------------------------------------------------------
router.get('/admin/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      activeUsers: 1240,
      totalVolumeInr: 485000,
      pendingApprovals: 3,
      flaggedListings: mockDb.reports.length,
      liveAuctions: mockDb.products.filter(p => p.status === 'live').length,
      completedAuctions: 412
    }
  });
});

router.get('/admin/reports', (req, res) => {
  res.json({ success: true, reports: mockDb.reports });
});

router.post('/admin/reports/:id/resolve', (req, res) => {
  mockDb.reports = mockDb.reports.filter(r => r.id !== req.params.id);
  res.json({ success: true, message: 'Report resolved.' });
});

export default router;
