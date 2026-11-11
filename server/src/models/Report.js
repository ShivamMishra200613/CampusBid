import mongoose from 'mongoose';

const reportStatuses = ['open', 'resolved'];
const resolutionActions = ['dismiss', 'remove_listing', 'suspend_user', 'warn_seller', 'none'];

const reportSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: reportStatuses,
      default: 'open',
      index: true
    },
    resolutionAction: {
      type: String,
      enum: resolutionActions,
      default: 'none'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

reportSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Report = mongoose.model('Report', reportSchema);
export default Report;
