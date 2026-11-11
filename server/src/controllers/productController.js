import Product from '../models/Product.js';
import Bid from '../models/Bid.js';
import Report from '../models/Report.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      condition,
      status,
      search,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Filter by status (public view default is live and ended)
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['live', 'ended'] };
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category.toLowerCase().trim();
    }

    // Filter by condition
    if (condition && condition !== 'all') {
      query.condition = condition;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.currentBid = {};
      if (minPrice !== undefined) query.currentBid.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.currentBid.$lte = Number(maxPrice);
    }

    // Text search
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Sort strategy
    let sortOption = { createdAt: -1 };
    if (sort === 'ending_soon') {
      sortOption = { endTime: 1 };
    } else if (sort === 'newly_listed') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'price_low') {
      sortOption = { currentBid: 1 };
    } else if (sort === 'price_high') {
      sortOption = { currentBid: -1 };
    } else if (sort === 'most_bids') {
      sortOption = { bidCount: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('seller', 'fullName isVerifiedStudent avatarUrl')
        .populate('highestBidder', 'fullName')
        .populate('winner', 'fullName')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
    ]);

    const formattedProducts = products.map((p) => {
      const doc = p.toJSON();
      if (p.seller) {
        doc.seller = {
          id: p.seller._id?.toString() || p.seller.id,
          name: p.seller.fullName,
          isVerified: p.seller.isVerifiedStudent,
          avatar: p.seller.avatarUrl
        };
      }
      return doc;
    });

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products: formattedProducts
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'fullName isVerifiedStudent avatarUrl')
      .populate('highestBidder', 'fullName')
      .populate('winner', 'fullName');

    if (!product || product.status === 'removed') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    const bids = await Bid.find({ product: product._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('bidder', 'fullName');

    const productJson = product.toJSON();
    if (product.seller) {
      productJson.seller = {
        id: product.seller._id?.toString() || product.seller.id,
        name: product.seller.fullName,
        isVerified: product.seller.isVerifiedStudent,
        avatar: product.seller.avatarUrl
      };
    }

    const recentBids = bids.map((b) => ({
      id: b.id,
      productId: product.id,
      bidderId: b.bidder?._id?.toString() || b.bidder?.id,
      bidderName: b.bidder?.fullName || 'Anonymous Bidder',
      amount: b.amount,
      createdAt: b.createdAt
    }));

    res.json({
      success: true,
      product: productJson,
      recentBids
    });
  } catch (err) {
    next(err);
  }
};

export const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      seller: req.user.id,
      status: { $ne: 'removed' }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: products.length,
      products: products.map((p) => p.toJSON())
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      category,
      condition,
      description,
      startingBid,
      minIncrement = 50,
      duration = '3d',
      images = [],
      isDraft = false
    } = req.body;

    const status = isDraft ? 'draft' : 'pending_approval';

    const product = await Product.create({
      title,
      category,
      condition,
      description,
      startingBid,
      currentBid: startingBid,
      minIncrement,
      duration,
      images,
      seller: req.user.id,
      status,
      endTime: null
    });

    res.status(201).json({
      success: true,
      product: product.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.status === 'removed') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    const sellerId = product.seller.toString ? product.seller.toString() : String(product.seller);
    if (sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_OWNER_ONLY',
          message: 'You do not have permission to edit this listing.'
        }
      });
    }

    if (product.bidCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LISTING_HAS_BIDS',
          message: 'Cannot edit a listing once bids have been placed.'
        }
      });
    }

    const allowedUpdates = [
      'title',
      'category',
      'condition',
      'description',
      'startingBid',
      'minIncrement',
      'duration',
      'images',
      'isDraft'
    ];

    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    if (req.body.startingBid !== undefined) {
      product.currentBid = req.body.startingBid;
    }

    await product.save();

    res.json({
      success: true,
      product: product.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.status === 'removed') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    const sellerId = product.seller.toString ? product.seller.toString() : String(product.seller);
    const isOwner = sellerId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this listing.'
        }
      });
    }

    // Soft delete
    product.status = 'removed';
    await product.save();

    res.json({
      success: true,
      message: 'Listing removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const publishProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.status === 'removed') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    const sellerId = product.seller.toString ? product.seller.toString() : String(product.seller);
    if (sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_OWNER_ONLY',
          message: 'You do not have permission to publish this listing.'
        }
      });
    }

    if (product.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only draft listings can be submitted for publication.'
        }
      });
    }

    product.status = 'pending_approval';
    await product.save();

    res.json({
      success: true,
      product: product.toJSON(),
      message: 'Listing submitted for admin moderation.'
    });
  } catch (err) {
    next(err);
  }
};

export const reportProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.status === 'removed') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' }
      });
    }

    const report = await Report.create({
      product: product._id,
      reportedBy: req.user.id,
      reason: req.body.reason
    });

    res.status(201).json({
      success: true,
      report: report.toJSON(),
      message: 'Report submitted successfully. Administrators have been notified.'
    });
  } catch (err) {
    next(err);
  }
};
