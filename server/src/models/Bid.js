import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Bid amount must be at least ₹1']
    }
  },
  {
    timestamps: true
  }
);

// Index on product + amount for fast bid history sorting and highest bid checks
bidSchema.index({ product: 1, amount: -1 });

bidSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Bid = mongoose.model('Bid', bidSchema);
export default Bid;
