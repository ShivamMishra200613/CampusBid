export const initialAuctions = [
  {
    id: '1',
    title: 'Vintage Smith-Corona Typewriter',
    category: 'electronics',
    condition: 'Like New',
    seller: {
      id: 'usr_alex_v',
      name: 'Alex V.',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    },
    currentBid: 2500,
    startingBid: 2000,
    minIncrement: 100,
    bidCount: 8,
    status: 'live',
    endTime: new Date(Date.now() + 2 * 3600 * 1000 + 15 * 60 * 1000 + 45 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: 'A meticulously maintained mid-century Smith-Corona portable typewriter. This piece represents a pinnacle of mechanical engineering and design elegance from its era. It features a fully functioning carriage, crisp striking keys, and retains its original carrying case. Perfect for collectors or writers seeking an authentic tactile experience, this artifact has been recently cleaned and fitted with a fresh dual-color ribbon.',
    images: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800',
      'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=800',
      'https://images.unsplash.com/photo-1510519138171-c70d76b6408a?w=800'
    ],
    bids: [
      { id: 'b1', bidderName: 'Marcus H.', amount: 2500, timeAgo: '12 mins ago', bidderId: 'usr_2' },
      { id: 'b2', bidderName: 'Alex Mercer', amount: 2400, timeAgo: '35 mins ago', bidderId: 'usr_68201' },
      { id: 'b3', bidderName: 'Sophia B.', amount: 2200, timeAgo: '2 hours ago', bidderId: 'usr_3' },
      { id: 'b4', bidderName: 'Oliver B.', amount: 2000, timeAgo: '5 hours ago', bidderId: 'usr_4' }
    ]
  },
  {
    id: '2',
    title: 'Stewart Calculus Early Transcendentals 8th Ed',
    category: 'books',
    condition: 'Like New',
    seller: {
      id: 'usr_oliver',
      name: 'Oliver B.',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
    },
    currentBid: 950,
    startingBid: 800,
    minIncrement: 50,
    bidCount: 5,
    status: 'live',
    endTime: new Date(Date.now() + 8 * 3600 * 1000 + 40 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: 'Essential reference textbook for engineering semesters at VESIT. Hardcover, no highlighted pages or dog-ears. Comes with the companion student solution manual.',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800',
      'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=800',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800'
    ],
    bids: [
      { id: 'b21', bidderName: 'Shivam M.', amount: 950, timeAgo: '5 mins ago', bidderId: 'usr_shivam' },
      { id: 'b22', bidderName: 'Alex Mercer', amount: 900, timeAgo: '1 hour ago', bidderId: 'usr_68201' }
    ]
  },
  {
    id: '3',
    title: 'Sony ANC Noise-Cancelling Headphones',
    category: 'electronics',
    condition: 'Refurbished',
    seller: {
      id: 'usr_sophia',
      name: 'Sophia B.',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'
    },
    currentBid: 4720,
    startingBid: 3500,
    minIncrement: 100,
    bidCount: 14,
    status: 'ended',
    endTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: 'Over-ear headphones with superior active noise cancellation. 30-hour battery life, USB-C fast charging. Perfect for studying in the VESIT library.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'
    ],
    winningBidder: {
      id: 'usr_68201',
      name: 'Alex Mercer',
      amount: 4720
    },
    bids: [
      { id: 'b31', bidderName: 'Alex Mercer', amount: 4720, timeAgo: '1 hour ago', bidderId: 'usr_68201' },
      { id: 'b32', bidderName: 'Daniel Reeves', amount: 4600, timeAgo: '2 hours ago', bidderId: 'usr_dan' }
    ]
  },
  {
    id: '4',
    title: 'Adjustable Wooden Drafting Table',
    category: 'furniture',
    condition: 'Vintage',
    seller: {
      id: 'usr_marcus',
      name: 'Marcus H.',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120'
    },
    currentBid: 6400,
    startingBid: 5000,
    minIncrement: 200,
    bidCount: 7,
    status: 'live',
    endTime: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: 'Solid teakwood engineering drafting table with adjustable tilt mechanism (0 to 60 degrees) and built-in ruler guide. Sturdy construction.',
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800',
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800'
    ],
    bids: [
      { id: 'b41', bidderName: 'Aria Collins', amount: 6400, timeAgo: '4 hours ago', bidderId: 'usr_aria' }
    ]
  },
  {
    id: '5',
    title: 'Firefox Target 21s Commuter Bicycle',
    category: 'sports',
    condition: 'Lightly Used',
    seller: {
      id: 'usr_alex_v',
      name: 'Alex V.',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    },
    currentBid: 2800,
    startingBid: 2200,
    minIncrement: 100,
    bidCount: 6,
    status: 'live',
    endTime: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: '21-speed Shimano gears, dual disc brakes, front suspension. Serviced and ready for daily campus transit.',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800'
    ],
    bids: [
      { id: 'b51', bidderName: 'Emma Laurent', amount: 2800, timeAgo: '20 mins ago', bidderId: 'usr_emma' }
    ]
  },
  {
    id: '6',
    title: 'Pro Graphics Drawing Tablet & Stylus',
    category: 'electronics',
    condition: 'Like New',
    seller: {
      id: 'usr_k_lee',
      name: 'K. Lee',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120'
    },
    currentBid: 3200,
    startingBid: 2500,
    minIncrement: 100,
    bidCount: 9,
    status: 'live',
    endTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: '8192 pressure levels battery-free stylus, 10 customizable express keys. Compatible with Windows, Mac, and Linux.',
    images: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'
    ],
    bids: [
      { id: 'b61', bidderName: 'Lucas Hart', amount: 3200, timeAgo: '30 mins ago', bidderId: 'usr_lucas' }
    ]
  },
  {
    id: '7',
    title: 'Vintage Leather Ergonomic Armchair',
    category: 'furniture',
    condition: 'Vintage',
    seller: {
      id: 'usr_j_smith',
      name: 'J. Smith',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120'
    },
    currentBid: 4200,
    startingBid: 3500,
    minIncrement: 100,
    bidCount: 5,
    status: 'live',
    endTime: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: 'Classic collegiate study chair with distressed tan leather upholstery and sturdy walnut wooden base.',
    images: [
      'https://images.unsplash.com/photo-1580481077195-c3a8b30f9131?w=800'
    ],
    bids: []
  },
  {
    id: '8',
    title: 'Advanced Linear Algebra Reference Volume',
    category: 'books',
    condition: 'Good',
    seller: {
      id: 'usr_jamie',
      name: 'Jamie Chen',
      isVerified: false,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120'
    },
    currentBid: 550,
    startingBid: 400,
    minIncrement: 50,
    bidCount: 4,
    status: 'live',
    endTime: new Date(Date.now() + 12 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    description: 'Comprehensive graduate & undergraduate reference covering vector spaces, eigensystems, and matrix decompositions.',
    images: [
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800'
    ],
    bids: [
      { id: 'b81', bidderName: 'Alex Rivera', amount: 550, timeAgo: '1 hour ago', bidderId: 'usr_alex_r' },
      { id: 'b82', bidderName: 'Alex Mercer', amount: 450, timeAgo: '3 hours ago', bidderId: 'usr_68201' }
    ]
  }
];

export const categories = [
  { key: 'all', label: 'All' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'books', label: 'Books' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'sports', label: 'Sports' },
  { key: 'others', label: 'Others' }
];

export default initialAuctions;
