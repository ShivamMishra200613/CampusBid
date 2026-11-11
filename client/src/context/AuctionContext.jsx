import React, { createContext, useContext, useState, useEffect } from 'react';
import initialAuctions from '../data/auctions';
import { useAuth } from './AuthContext';

const AuctionContext = createContext();

const INITIAL_REPORTS = [
  {
    id: 'rep_1',
    productId: '3',
    productTitle: 'MacBook Pro M1 (Reported)',
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
];

const INITIAL_PENDING_LISTINGS = [
  {
    id: 'pending_1',
    title: 'Vintage Leather Armchair',
    seller: 'J. Smith',
    submittedAt: '2h ago',
    image: 'https://images.unsplash.com/photo-1580481077195-c3a8b30f9131?w=300',
    category: 'furniture',
    startingBid: 3500
  },
  {
    id: 'pending_2',
    title: 'Rare Architecture Books (Set of 5)',
    seller: 'A. Miller',
    submittedAt: '4h ago',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300',
    category: 'books',
    startingBid: 1200
  },
  {
    id: 'pending_3',
    title: 'Pro Drawing Tablet',
    seller: 'K. Lee',
    submittedAt: '5h ago',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300',
    category: 'electronics',
    startingBid: 2500
  }
];

export const AuctionProvider = ({ children }) => {
  const { user } = useAuth();

  const [auctions, setAuctions] = useState(() => {
    const saved = localStorage.getItem('campusbid_auctions');
    return saved ? JSON.parse(saved) : initialAuctions;
  });

  const [myBids, setMyBids] = useState(() => {
    const saved = localStorage.getItem('campusbid_mybids');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'mb_1',
        productId: '1',
        productTitle: 'Vintage Smith-Corona Typewriter',
        productImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300',
        sellerName: 'Alex V.',
        sellerVerified: true,
        yourBid: 2400,
        highestBid: 2500,
        status: 'Outbid',
        timeLeft: '02h : 15m : 45s',
        endTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'mb_2',
        productId: '3',
        productTitle: 'Sony ANC Noise-Cancelling Headphones',
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
        sellerName: 'Sophia B.',
        sellerVerified: true,
        yourBid: 4720,
        highestBid: 4720,
        status: 'Won',
        timeLeft: 'Ended',
        endTime: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        id: 'mb_3',
        productId: '5',
        productTitle: 'Firefox Target 21s Commuter Bicycle',
        productImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300',
        sellerName: 'Alex V.',
        sellerVerified: true,
        yourBid: 2800,
        highestBid: 2800,
        status: 'Winning',
        timeLeft: '14h : 00m : 00s',
        endTime: new Date(Date.now() + 14 * 3600 * 1000).toISOString()
      }
    ];
  });

  const [myDrafts, setMyDrafts] = useState([
    {
      id: 'draft_1',
      title: 'Adjustable Drafting Table (Draft)',
      category: 'furniture',
      condition: 'Vintage',
      startingBid: 4500,
      description: 'Draft listing of drafting table',
      status: 'draft',
      images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=300']
    }
  ]);

  const [pendingListings, setPendingListings] = useState(INITIAL_PENDING_LISTINGS);
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      type: 'outbid',
      title: 'You have been outbid!',
      message: 'Marcus H. placed a higher bid of ₹2,500 on Vintage Smith-Corona Typewriter.',
      productId: '1',
      read: false,
      createdAt: '12 mins ago'
    },
    {
      id: 'notif_2',
      type: 'auction_won',
      title: 'Auction Won!',
      message: 'Congratulations! You won Sony ANC Noise-Cancelling Headphones for ₹4,720.',
      productId: '3',
      read: false,
      createdAt: '1 hour ago'
    }
  ]);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('campusbid_auctions', JSON.stringify(auctions));
  }, [auctions]);

  useEffect(() => {
    localStorage.setItem('campusbid_mybids', JSON.stringify(myBids));
  }, [myBids]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  const placeBid = (productId, amount) => {
    const targetAuction = auctions.find((a) => a.id === productId);
    if (!targetAuction) {
      showToast('Auction not found', 'error');
      return false;
    }

    if (targetAuction.status !== 'live') {
      showToast('This auction has already ended.', 'error');
      return false;
    }

    const minRequired = targetAuction.currentBid + targetAuction.minIncrement;
    if (amount < minRequired) {
      showToast(`Minimum valid bid is ₹${minRequired.toLocaleString('en-IN')}`, 'error');
      return false;
    }

    const newBidObj = {
      id: `bid_${Date.now()}`,
      bidderName: user ? user.fullName : 'Alex Mercer',
      bidderId: user ? user.id : 'usr_68201',
      amount: Number(amount),
      timeAgo: 'Just now',
      createdAt: new Date().toISOString()
    };

    setAuctions((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            currentBid: Number(amount),
            bidCount: (item.bidCount || 0) + 1,
            bids: [newBidObj, ...(item.bids || [])]
          };
        }
        return item;
      })
    );

    // Update My Bids
    setMyBids((prev) => {
      const existing = prev.filter((b) => b.productId !== productId);
      return [
        {
          id: `mb_${Date.now()}`,
          productId: targetAuction.id,
          productTitle: targetAuction.title,
          productImage: targetAuction.images[0],
          sellerName: targetAuction.seller?.name || 'VESIT Student',
          sellerVerified: targetAuction.seller?.isVerified || false,
          yourBid: Number(amount),
          highestBid: Number(amount),
          status: 'Winning',
          timeLeft: '02h : 15m : 45s',
          endTime: targetAuction.endTime
        },
        ...existing
      ];
    });

    showToast(`Bid of ₹${Number(amount).toLocaleString('en-IN')} placed successfully!`, 'success');
    return true;
  };

  const createListing = (data) => {
    const durationHours = data.duration === '24h' ? 24 : data.duration === '7d' ? 168 : 72;
    const newProduct = {
      id: String(Date.now()),
      title: data.title,
      category: data.category,
      condition: data.condition,
      description: data.description,
      seller: {
        id: user ? user.id : 'usr_68201',
        name: user ? user.fullName : 'Alex Mercer',
        isVerified: true,
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
      },
      currentBid: Number(data.startingBid),
      startingBid: Number(data.startingBid),
      minIncrement: Number(data.minIncrement) || 50,
      bidCount: 0,
      status: data.isDraft ? 'draft' : 'live',
      endTime: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      images: data.images && data.images.length > 0 ? data.images : [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
      ],
      bids: []
    };

    if (data.isDraft) {
      setMyDrafts((prev) => [newProduct, ...prev]);
      showToast('Listing saved to drafts!', 'success');
    } else {
      setAuctions((prev) => [newProduct, ...prev]);
      showToast('Auction published live on CampusBid!', 'success');
    }
    return newProduct;
  };

  const publishDraft = (draftId) => {
    const draft = myDrafts.find((d) => d.id === draftId);
    if (!draft) return;
    const published = {
      ...draft,
      status: 'live',
      endTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString()
    };
    setMyDrafts((prev) => prev.filter((d) => d.id !== draftId));
    setAuctions((prev) => [published, ...prev]);
    showToast('Draft published to live marketplace!', 'success');
  };

  const deleteListing = (id) => {
    setAuctions((prev) => prev.filter((a) => a.id !== id));
    setMyDrafts((prev) => prev.filter((d) => d.id !== id));
    showToast('Listing deleted successfully.', 'success');
  };

  const approveListing = (pendingId) => {
    const item = pendingListings.find((p) => p.id === pendingId);
    if (item) {
      const approvedProduct = {
        id: String(Date.now()),
        title: item.title,
        category: item.category || 'others',
        condition: 'Good',
        description: 'Moderated and approved listing for VESIT students.',
        seller: {
          id: `usr_${item.seller.replace(/\s+/g, '_').toLowerCase()}`,
          name: item.seller,
          isVerified: true,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
        },
        currentBid: item.startingBid || 1000,
        startingBid: item.startingBid || 1000,
        minIncrement: 50,
        bidCount: 0,
        status: 'live',
        endTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        images: [item.image],
        bids: []
      };
      setAuctions((prev) => [approvedProduct, ...prev]);
      setPendingListings((prev) => prev.filter((p) => p.id !== pendingId));
      showToast(`Listing "${item.title}" approved and published!`, 'success');
    }
  };

  const rejectListing = (pendingId) => {
    setPendingListings((prev) => prev.filter((p) => p.id !== pendingId));
    showToast('Listing rejected.', 'info');
  };

  const resolveReport = (reportId) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    showToast('Dispute / report marked as resolved.', 'success');
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <AuctionContext.Provider
      value={{
        auctions,
        myBids,
        myDrafts,
        pendingListings,
        reports,
        notifications,
        toast,
        placeBid,
        createListing,
        publishDraft,
        deleteListing,
        approveListing,
        rejectListing,
        resolveReport,
        markNotificationRead,
        markAllNotificationsRead,
        showToast
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => useContext(AuctionContext);
