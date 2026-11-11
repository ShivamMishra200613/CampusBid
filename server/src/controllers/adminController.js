import User from '../models/User.js';
import Product from '../models/Product.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const [
      activeUsers,
      pendingApprovals,
      flaggedListings,
      liveAuctions,
      completedAuctions,
      volumeAggregate
    ] = await Promise.all([
      User.countDocuments({ isSuspended: false }),
      Product.countDocuments({ status: 'pending_approval' }),
      Report.countDocuments({ status: 'open' }),
      Product.countDocuments({ status: 'live' }),
      Product.countDocuments({ status: 'ended' }),
      Product.aggregate([
        { $match: { status: 'ended', highestBidder: { $ne: null } } },
        { $group: { _id: null, total: { $sum: '$currentBid' } } }
      ])
    ]);

    const totalVolumeInr = volumeAggregate.length > 0 ? volumeAggregate[0].total : 0;

    res.json({
      success: true,
      stats: {
        activeUsers,
        totalVolumeInr,
        pendingApprovals,
        flaggedListings,
        liveAuctions,
        completedAuctions
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingListings = async (req, res, next) => {
  try {
    const listings = await Product.find({ status: 'pending_approval' })
      .populate('seller', 'fullName email classBranch rollNo avatarUrl isVerifiedStudent')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: listings.length,
      listings: listings.map((p) => p.toJSON())
    });
  } catch (err) {
    next(err);
  }
};

export const moderateListing = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product || product.status === 'removed') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    if (action === 'approve') {
      const durationHours = product.duration === '24h' ? 24 : product.duration === '7d' ? 168 : 72;
      product.status = 'live';
      product.endTime = new Date(Date.now() + durationHours * 3600 * 1000);
      product.rejectionReason = '';
      await product.save();

      await Notification.create({
        user: product.seller,
        type: 'listing_approved',
        title: 'Listing Approved!',
        message: `Your listing "${product.title}" has been approved and is now live for bidding!`,
        product: product._id
      });
    } else if (action === 'reject') {
      product.status = 'removed';
      product.rejectionReason = reason || 'Does not meet campus auction guidelines.';
      await product.save();

      await Notification.create({
        user: product.seller,
        type: 'listing_rejected',
        title: 'Listing Rejected',
        message: `Your listing "${product.title}" was rejected: ${product.rejectionReason}`,
        product: product._id
      });
    }

    res.json({
      success: true,
      product: product.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('product', 'title currentBid images status seller')
      .populate('reportedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports: reports.map((r) => r.toJSON())
    });
  } catch (err) {
    next(err);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const { resolutionAction, notes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found.' }
      });
    }

    report.status = 'resolved';
    report.resolutionAction = resolutionAction;
    report.notes = notes || '';
    await report.save();

    if (resolutionAction === 'remove_listing') {
      await Product.findByIdAndUpdate(report.product, { status: 'removed' });
    } else if (resolutionAction === 'suspend_user') {
      const prod = await Product.findById(report.product);
      if (prod && prod.seller) {
        await User.findByIdAndUpdate(prod.seller, { isSuspended: true });
      }
    }

    res.json({
      success: true,
      report: report.toJSON(),
      message: 'Report resolved successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { rollNo: { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum)
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      users: users.map((u) => u.toJSON())
    });
  } catch (err) {
    next(err);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    if (target.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_SUSPEND_SELF', message: 'Administrators cannot suspend themselves.' }
      });
    }

    if (target.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_SUSPEND_ADMIN',
          message: 'Cannot suspend another administrator account.'
        }
      });
    }

    target.isSuspended = true;
    await target.save();

    res.json({
      success: true,
      message: 'User account suspended successfully.',
      user: target.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const unsuspendUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    target.isSuspended = false;
    await target.save();

    res.json({
      success: true,
      message: 'User account reactivated successfully.',
      user: target.toJSON()
    });
  } catch (err) {
    next(err);
  }
};
