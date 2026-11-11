import Product from '../models/Product.js';
import Bid from '../models/Bid.js';
import Notification from '../models/Notification.js';
import { notifyOutbid } from '../services/notifier.js';
import { emitNewBid } from '../sockets/index.js';

export const placeBid = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const amount = Number(req.body.amount);

    const product = await Product.findById(productId);
    if (!product || product.status === 'removed') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    const sellerId = product.seller.toString();
    if (sellerId === req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'BID_ON_OWN_LISTING',
          message: 'Sellers are not permitted to bid on their own listings.'
        }
      });
    }

    if (product.status !== 'live') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUCTION_NOT_ACTIVE',
          message: 'Bids can only be placed on active live auctions.'
        }
      });
    }

    const now = new Date();
    if (product.endTime && now > product.endTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUCTION_ENDED',
          message: 'This auction has already ended.'
        }
      });
    }

    const minRequired = product.currentBid + product.minIncrement;
    if (amount < minRequired) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BID_TOO_LOW',
          message: `Minimum bid must be at least ₹${minRequired.toLocaleString('en-IN')}`
        }
      });
    }

    // Atomic update with concurrency guard
    const previousProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        status: 'live',
        seller: { $ne: req.user.id },
        $or: [
          { endTime: null },
          { endTime: { $gt: now } }
        ],
        $expr: {
          $gte: [amount, { $add: ['$currentBid', '$minIncrement'] }]
        }
      },
      {
        $set: {
          currentBid: amount,
          highestBidder: req.user.id
        },
        $inc: { bidCount: 1 }
      },
      { new: false }
    );

    if (!previousProduct) {
      // Concurrency race: another higher bid landed right before this one
      const latest = await Product.findById(productId);
      const latestMin = latest.currentBid + latest.minIncrement;
      return res.status(400).json({
        success: false,
        error: {
          code: 'BID_OUTDATED',
          message: `A higher bid was just placed. The new minimum bid is ₹${latestMin.toLocaleString('en-IN')}.`
        }
      });
    }

    // Record bid in database
    const bid = await Bid.create({
      product: productId,
      bidder: req.user.id,
      amount
    });

    // Notify previous highest bidder of being outbid (respects notificationPreferences.outbidAlerts)
    if (
      previousProduct.highestBidder &&
      previousProduct.highestBidder.toString() !== req.user.id
    ) {
      await notifyOutbid({
        previousBidderId: previousProduct.highestBidder,
        currentBidderName: req.user.fullName,
        amount,
        product: previousProduct
      });
    }

    // Emit real-time event via Socket.IO
    emitNewBid({
      productId: product.id,
      bid: {
        id: bid.id,
        productId: product.id,
        bidderId: req.user.id,
        bidderName: req.user.fullName,
        amount,
        createdAt: bid.createdAt
      },
      currentBid: amount,
      bidCount: (previousProduct.bidCount || 0) + 1,
      highestBidder: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully!',
      bid: {
        id: bid.id,
        productId: product.id,
        bidderId: req.user.id,
        bidderName: req.user.fullName,
        amount,
        createdAt: bid.createdAt
      },
      updatedCurrentBid: amount
    });
  } catch (err) {
    next(err);
  }
};

export const getProductBids = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [total, bids] = await Promise.all([
      Bid.countDocuments({ product: productId }),
      Bid.find({ product: productId })
        .populate('bidder', 'fullName avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      bids: bids.map((b) => ({
        id: b.id,
        productId,
        bidderId: b.bidder?._id?.toString() || b.bidder?.id,
        bidderName: b.bidder?.fullName || 'Student',
        amount: b.amount,
        createdAt: b.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const getMyBids = async (req, res, next) => {
  try {
    const { filter = 'all' } = req.query;

    // Find all distinct products the user has bid on
    const userBids = await Bid.find({ bidder: req.user.id })
      .populate({
        path: 'product',
        populate: [
          { path: 'seller', select: 'fullName isVerifiedStudent' },
          { path: 'highestBidder', select: 'fullName' },
          { path: 'winner', select: 'fullName' }
        ]
      })
      .sort({ createdAt: -1 });

    // Group highest bid per product
    const productMap = new Map();

    for (const b of userBids) {
      if (!b.product || b.product.status === 'removed') continue;
      const pid = b.product.id || b.product._id.toString();

      if (!productMap.has(pid) || productMap.get(pid).yourBid < b.amount) {
        let status = 'Outbid';
        const isLive = b.product.status === 'live';
        const isHighest = b.product.highestBidder?._id?.toString() === req.user.id ||
                          b.product.highestBidder?.id === req.user.id;
        const isWinner = b.product.winner?._id?.toString() === req.user.id ||
                         b.product.winner?.id === req.user.id;

        if (isLive) {
          status = isHighest ? 'Winning' : 'Outbid';
        } else {
          status = isWinner ? 'Won' : 'Lost';
        }

        let timeLeft = 'Ended';
        if (isLive && b.product.endTime) {
          const diffMs = new Date(b.product.endTime) - Date.now();
          if (diffMs > 0) {
            const hrs = Math.floor(diffMs / 3600000);
            const mins = Math.floor((diffMs % 3600000) / 60000);
            const secs = Math.floor((diffMs % 60000) / 1000);
            timeLeft = `${String(hrs).padStart(2, '0')}h : ${String(mins).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}s`;
          }
        }

        productMap.set(pid, {
          id: b.id,
          productId: pid,
          productTitle: b.product.title,
          productImage: b.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
          sellerName: b.product.seller?.fullName || 'VESIT Student',
          sellerVerified: b.product.seller?.isVerifiedStudent ?? true,
          yourBid: b.amount,
          highestBid: b.product.currentBid,
          status,
          timeLeft,
          endTime: b.product.endTime ? b.product.endTime.toISOString() : ''
        });
      }
    }

    let records = Array.from(productMap.values());

    if (filter && filter !== 'all') {
      const lower = filter.toLowerCase();
      records = records.filter((r) => r.status.toLowerCase() === lower);
    }

    res.json({
      success: true,
      total: records.length,
      bids: records
    });
  } catch (err) {
    next(err);
  }
};
