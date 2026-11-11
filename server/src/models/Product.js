import mongoose from 'mongoose';

const productCategories = [
  'electronics',
  'books',
  'furniture',
  'fashion',
  'sports',
  'others'
];

const productConditions = [
  'new',
  'like-new',
  'good',
  'fair',
  'vintage',
  'Original Artwork',
  'Bronze Cast',
  'Marble Sculpture',
  'Painted Wood Sculpture'
];

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: productCategories,
      lowercase: true,
      trim: true
    },
    condition: {
      type: String,
      required: true,
      trim: true,
      default: 'good'
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startingBid: {
      type: Number,
      required: true,
      min: [1, 'Starting bid must be at least ₹1']
    },
    currentBid: {
      type: Number,
      required: true,
      default: function () {
        return this.startingBid;
      }
    },
    minIncrement: {
      type: Number,
      default: 50,
      min: [1, 'Minimum increment must be at least ₹1']
    },
    bidCount: {
      type: Number,
      default: 0
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'live', 'ended', 'removed'],
      default: 'pending_approval'
    },
    duration: {
      type: String,
      enum: ['24h', '3d', '7d'],
      default: '3d'
    },
    endTime: {
      type: Date,
      default: null
    },
    images: {
      type: [String],
      default: []
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for sweeper & live listings
productSchema.index({ status: 1, endTime: 1 });
// Category index for filtering
productSchema.index({ category: 1 });
// Text index for search
productSchema.index({ title: 'text', description: 'text' });

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Product = mongoose.model('Product', productSchema);
export default Product;
