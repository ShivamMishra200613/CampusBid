import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/@ves\.ac\.in$/, 'Email must be a valid @ves.ac.in address']
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    classBranch: {
      type: String,
      default: ''
    },
    rollNo: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    isVerifiedStudent: {
      type: Boolean,
      default: true
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    stats: {
      itemsSold: { type: Number, default: 0 },
      itemsBought: { type: Number, default: 0 },
      rating: { type: Number, default: 5.0 }
    },
    notificationPreferences: {
      outbidAlerts: { type: Boolean, default: true },
      auctionEndingAlerts: { type: Boolean, default: true },
      newMessageAlerts: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    if (!ret.memberSince && ret.createdAt) {
      ret.memberSince = new Date(ret.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return ret;
  }
});

export const User = mongoose.model('User', userSchema);
export default User;
