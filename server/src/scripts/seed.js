import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../config/config.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Bid from '../models/Bid.js';
import Notification from '../models/Notification.js';
import Report from '../models/Report.js';

export const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Seed script refused to run in production environment.');
  }

  console.log('--- Seeding CampusBid Database ---');
  await connectDB();

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Bid.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({})
  ]);

  console.log('Cleared existing collections.');

  // Password hashes (cost 10)
  const studentPasswordHash = await bcrypt.hash('Password123', 10);
  const adminPasswordHash = await bcrypt.hash(config.adminPassword || 'change-me-admin', 10);

  // 1. Create Admin and 4 Students
  const admin = await User.create({
    fullName: 'VESIT Admin',
    email: config.adminEmail || 'admin@ves.ac.in',
    passwordHash: adminPasswordHash,
    role: 'admin',
    classBranch: 'Staff / CMPN Dept',
    rollNo: 'STAFF01',
    isVerifiedStudent: true,
    isSuspended: false,
    phone: '+91 98200 11223',
    bio: 'CampusBid Platform Administrator at VESIT.'
  });

  const rahul = await User.create({
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@ves.ac.in',
    passwordHash: studentPasswordHash,
    role: 'student',
    classBranch: 'D12C / CMPN',
    rollNo: '42',
    isVerifiedStudent: true,
    isSuspended: false,
    phone: '+91 98765 43210',
    bio: 'Third-year Computer Engineering student. Avid tech collector.'
  });

  const priya = await User.create({
    fullName: 'Priya Patel',
    email: 'priya.patel@ves.ac.in',
    passwordHash: studentPasswordHash,
    role: 'student',
    classBranch: 'D12A / IT',
    rollNo: '18',
    isVerifiedStudent: true,
    isSuspended: false,
    phone: '+91 98765 43211',
    bio: 'IT student interested in literature, audio gear, and sports.'
  });

  const aditya = await User.create({
    fullName: 'Aditya Verma',
    email: 'aditya.verma@ves.ac.in',
    passwordHash: studentPasswordHash,
    role: 'student',
    classBranch: 'D17B / EXTC',
    rollNo: '55',
    isVerifiedStudent: true,
    isSuspended: false,
    phone: '+91 98765 43212',
    bio: 'Electronics enthusiast and campus furniture reseller.'
  });

  const ananya = await User.create({
    fullName: 'Ananya Iyer',
    email: 'ananya.iyer@ves.ac.in',
    passwordHash: studentPasswordHash,
    role: 'student',
    classBranch: 'D7 / INST',
    rollNo: '23',
    isVerifiedStudent: true,
    isSuspended: false,
    phone: '+91 98765 43213',
    bio: 'Instrumentation student and campus sports council representative.'
  });

  const sneha = await User.create({
    fullName: 'Sneha Kulkarni',
    email: 'sneha.k@ves.ac.in',
    passwordHash: studentPasswordHash,
    role: 'student',
    classBranch: 'D10 / EXTC',
    rollNo: '37',
    isVerifiedStudent: true,
    isSuspended: true,
    phone: '+91 98765 43214',
    bio: 'Suspended student account for moderation verification.'
  });

  console.log('Created 1 Admin and 5 Student accounts.');

  const now = Date.now();

  // 2. Create 8 Products
  // P1: Ending in 2 minutes (sweeper live demo)
  const p1 = await Product.create({
    title: 'MacBook Air M1 2020 (8GB/256GB Space Grey)',
    category: 'electronics',
    condition: 'like-new',
    description:
      'Battery health 91%. Includes original 30W USB-C charger and box. Perfect for coding and college projects.',
    seller: rahul._id,
    startingBid: 42000,
    currentBid: 46500,
    minIncrement: 500,
    bidCount: 3,
    status: 'live',
    duration: '24h',
    endTime: new Date(now + 2 * 60 * 1000), // 2 mins from now
    highestBidder: priya._id,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60'
    ]
  });

  // P2: Live headphones with active bidding
  const p2 = await Product.create({
    title: 'Sony WH-1000XM4 Noise Canceling Headphones',
    category: 'electronics',
    condition: 'good',
    description:
      'Active Noise Canceling working flawlessly. Minor ear-cup wear. Comes with aux cable and carrying case.',
    seller: priya._id,
    startingBid: 12000,
    currentBid: 14500,
    minIncrement: 200,
    bidCount: 4,
    status: 'live',
    duration: '24h',
    endTime: new Date(now + 24 * 60 * 60 * 1000),
    highestBidder: aditya._id,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60'
    ]
  });

  // P3: Books bundle
  const p3 = await Product.create({
    title: 'Engineering Mathematics & Core CS Textbooks Bundle',
    category: 'books',
    condition: 'good',
    description:
      'Includes Kumbhojkar Math 3 & 4, Cormen Algorithms (CLRS), and Tanenbaum Computer Networks.',
    seller: rahul._id,
    startingBid: 1200,
    currentBid: 1500,
    minIncrement: 50,
    bidCount: 2,
    status: 'live',
    duration: '3d',
    endTime: new Date(now + 3 * 24 * 60 * 60 * 1000),
    highestBidder: ananya._id,
    images: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=60'
    ]
  });

  // P4: Furniture
  const p4 = await Product.create({
    title: 'Ergonomic Mesh Study Chair with Lumbar Support',
    category: 'furniture',
    condition: 'like-new',
    description:
      'Adjustable height, breathable mesh back, comfortable seat cushion. Used for 4 months in hostel.',
    seller: aditya._id,
    startingBid: 3500,
    currentBid: 4200,
    minIncrement: 100,
    bidCount: 3,
    status: 'live',
    duration: '7d',
    endTime: new Date(now + 5 * 24 * 60 * 60 * 1000),
    highestBidder: rahul._id,
    images: [
      'https://images.unsplash.com/photo-1776548759644-5da0988a7874?w=800&auto=format&fit=crop&q=60'
    ]
  });

  // P5: Pending approval (for Admin Approval demo)
  const p5 = await Product.create({
    title: 'VESIT College Sports Hoodie (Size L, Navy Blue)',
    category: 'fashion',
    condition: 'new',
    description: 'Unopened official VESIT Sports Council hoodie from Sphurti. High-quality fleece.',
    seller: ananya._id,
    startingBid: 600,
    currentBid: 600,
    minIncrement: 50,
    bidCount: 0,
    status: 'pending_approval',
    duration: '3d',
    endTime: null,
    highestBidder: null,
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=60'
    ]
  });

  // P6: Ended auction won by Rahul Sharma
  const p6 = await Product.create({
    title: 'Cosco Tournament Badminton Racket + Shuttles Pack',
    category: 'sports',
    condition: 'good',
    description: 'Strung at 24 lbs. Includes full thermo cover and 3 Yonex Mavis 350 shuttles.',
    seller: priya._id,
    startingBid: 800,
    currentBid: 1100,
    minIncrement: 50,
    bidCount: 2,
    status: 'ended',
    duration: '24h',
    endTime: new Date(now - 60 * 60 * 1000), // 1 hour ago
    highestBidder: rahul._id,
    winner: rahul._id,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60'
    ]
  });

  // P7: Ended auction won by Priya Patel
  const p7 = await Product.create({
    title: 'Scientific Calculator Casio fx-991EX ClassWiz',
    category: 'others',
    condition: 'like-new',
    description: '552 functions, natural textbook display. Approved for Mumbai University exams.',
    seller: aditya._id,
    startingBid: 900,
    currentBid: 1350,
    minIncrement: 50,
    bidCount: 3,
    status: 'ended',
    duration: '3d',
    endTime: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    highestBidder: priya._id,
    winner: priya._id,
    images: [
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=60'
    ]
  });

  // P8: Draft product
  const p8 = await Product.create({
    title: 'Arduino Uno R3 Starter Kit with Sensors and Jumper Wires',
    category: 'electronics',
    condition: 'new',
    description:
      'Unopened Arduino Uno R3 kit with breadboard, LEDs, resistors, LCD display, and ultrasonic sensor.',
    seller: rahul._id,
    startingBid: 1500,
    currentBid: 1500,
    minIncrement: 100,
    bidCount: 0,
    status: 'draft',
    duration: '7d',
    endTime: null,
    highestBidder: null,
    images: [
      'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&auto=format&fit=crop&q=60'
    ]
  });

  console.log('Created 8 Products across categories and statuses.');

  // 3. Create Bid history
  // P1 Bids
  await Bid.create([
    {
      product: p1._id,
      bidder: aditya._id,
      amount: 43000,
      createdAt: new Date(now - 30 * 60 * 1000)
    },
    {
      product: p1._id,
      bidder: ananya._id,
      amount: 45000,
      createdAt: new Date(now - 20 * 60 * 1000)
    },
    { product: p1._id, bidder: priya._id, amount: 46500, createdAt: new Date(now - 5 * 60 * 1000) }
  ]);

  // P2 Bids
  await Bid.create([
    {
      product: p2._id,
      bidder: rahul._id,
      amount: 12500,
      createdAt: new Date(now - 5 * 60 * 60 * 1000)
    },
    {
      product: p2._id,
      bidder: ananya._id,
      amount: 13200,
      createdAt: new Date(now - 3 * 60 * 60 * 1000)
    },
    {
      product: p2._id,
      bidder: rahul._id,
      amount: 14000,
      createdAt: new Date(now - 2 * 60 * 60 * 1000)
    },
    {
      product: p2._id,
      bidder: aditya._id,
      amount: 14500,
      createdAt: new Date(now - 30 * 60 * 1000)
    }
  ]);

  // P3 Bids
  await Bid.create([
    {
      product: p3._id,
      bidder: aditya._id,
      amount: 1350,
      createdAt: new Date(now - 10 * 60 * 60 * 1000)
    },
    {
      product: p3._id,
      bidder: ananya._id,
      amount: 1500,
      createdAt: new Date(now - 4 * 60 * 60 * 1000)
    }
  ]);

  // P4 Bids
  await Bid.create([
    {
      product: p4._id,
      bidder: priya._id,
      amount: 3700,
      createdAt: new Date(now - 12 * 60 * 60 * 1000)
    },
    {
      product: p4._id,
      bidder: ananya._id,
      amount: 4000,
      createdAt: new Date(now - 8 * 60 * 60 * 1000)
    },
    {
      product: p4._id,
      bidder: rahul._id,
      amount: 4200,
      createdAt: new Date(now - 1 * 60 * 60 * 1000)
    }
  ]);

  // P6 Bids (Ended)
  await Bid.create([
    {
      product: p6._id,
      bidder: aditya._id,
      amount: 950,
      createdAt: new Date(now - 5 * 60 * 60 * 1000)
    },
    {
      product: p6._id,
      bidder: rahul._id,
      amount: 1100,
      createdAt: new Date(now - 2 * 60 * 60 * 1000)
    }
  ]);

  // P7 Bids (Ended)
  await Bid.create([
    {
      product: p7._id,
      bidder: rahul._id,
      amount: 1050,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000)
    },
    {
      product: p7._id,
      bidder: ananya._id,
      amount: 1200,
      createdAt: new Date(now - 2.5 * 24 * 60 * 60 * 1000)
    },
    {
      product: p7._id,
      bidder: priya._id,
      amount: 1350,
      createdAt: new Date(now - 2.1 * 24 * 60 * 60 * 1000)
    }
  ]);

  console.log('Created Bid records.');

  // 4. Create Notifications
  await Notification.create([
    {
      user: rahul._id,
      type: 'auction_won',
      title: 'Auction Won!',
      message:
        'Congratulations! You won "Cosco Tournament Badminton Racket + Shuttles Pack" for ₹1,100.',
      product: p6._id,
      read: false
    },
    {
      user: rahul._id,
      type: 'outbid',
      title: 'You were outbid!',
      message:
        'Aditya placed a higher bid of ₹14,500 on "Sony WH-1000XM4 Noise Canceling Headphones".',
      product: p2._id,
      read: true
    },
    {
      user: priya._id,
      type: 'outbid',
      title: 'You were outbid!',
      message:
        'Rahul placed a higher bid of ₹4,200 on "Ergonomic Mesh Study Chair with Lumbar Support".',
      product: p4._id,
      read: false
    },
    {
      user: ananya._id,
      type: 'outbid',
      title: 'You were outbid!',
      message: 'Priya placed a higher bid of ₹46,500 on "MacBook Air M1 2020".',
      product: p1._id,
      read: false
    }
  ]);

  console.log('Created Notifications.');

  // 5. Create Reports
  await Report.create([
    {
      product: p2._id,
      reportedBy: ananya._id,
      reason: 'Requesting verification of serial number and Mumbai warranty status before bidding.',
      status: 'open',
      resolutionAction: 'none',
      notes: ''
    }
  ]);

  console.log('Created Reports.');
  console.log('--- Database Seeding Completed Successfully ---');

  console.log('\nSeeded Demo Accounts:');
  console.table([
    {
      Role: 'Admin',
      Email: config.adminEmail || 'admin@ves.ac.in',
      Password: '[CONFIGURED VIA ADMIN_PASSWORD]',
      Persona: 'Platform Administrator'
    },
    {
      Role: 'Student',
      Email: 'rahul.sharma@ves.ac.in',
      Password: 'Password123',
      Persona: 'Primary Seller (Listings & Drafts)'
    },
    {
      Role: 'Student',
      Email: 'priya.patel@ves.ac.in',
      Password: 'Password123',
      Persona: 'Active Bidder (Leading Bids)'
    },
    {
      Role: 'Student',
      Email: 'aditya.verma@ves.ac.in',
      Password: 'Password123',
      Persona: 'Competing Bidder (Live Bidding)'
    },
    {
      Role: 'Student',
      Email: 'ananya.iyer@ves.ac.in',
      Password: 'Password123',
      Persona: 'Auction Winner & Reporter'
    },
    {
      Role: 'Student',
      Email: 'sneha.k@ves.ac.in',
      Password: 'Password123',
      Persona: 'Suspended Student (returns 403)'
    }
  ]);
  console.log(
    'Note: All student accounts use password "Password123". Admin password is set via ADMIN_PASSWORD.'
  );
  console.log(
    '      sneha.k@ves.ac.in is seeded as suspended and returns 403 ACCOUNT_SUSPENDED.\n'
  );

  return {
    admin,
    students: [rahul, priya, aditya, ananya, sneha],
    users: [admin, rahul, priya, aditya, ananya, sneha],
    products: [p1, p2, p3, p4, p5, p6, p7, p8]
  };
};

// If run directly via `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seeding failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}
