import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitNotification } from '../sockets/index.js';

/**
 * Dispatches an outbid alert to the previous highest bidder if preferences permit.
 */
export const notifyOutbid = async ({ previousBidderId, currentBidderName, amount, product }) => {
  try {
    if (!previousBidderId) return;

    const prevUser = await User.findById(previousBidderId);
    if (!prevUser) return;
    if (prevUser.notificationPreferences?.outbidAlerts === false) return;

    const notif = await Notification.create({
      user: prevUser._id,
      type: 'outbid',
      title: 'You were outbid!',
      message: `${currentBidderName} placed a higher bid of ₹${amount.toLocaleString('en-IN')} on "${product.title}".`,
      product: product._id || product.id
    });
    emitNotification(prevUser._id.toString(), notif.toJSON());
  } catch (err) {
    console.error('Error sending outbid notification:', err.message);
  }
};

/**
 * Dispatches notifications when an auction finishes.
 * - If won: winner gets 'auction_won', seller gets 'auction_ended' with winning bid.
 * - If ended with no bids: seller gets 'auction_ended' with "no bids" notice.
 */
export const notifyAuctionEnded = async (product) => {
  try {
    const populated = await product.populate([
      { path: 'seller', select: 'fullName email notificationPreferences' },
      { path: 'highestBidder', select: 'fullName email notificationPreferences' }
    ]);

    const seller = populated.seller;
    const winner = populated.highestBidder;

    if (winner) {
      // Notify the winning student
      if (winner.notificationPreferences?.auctionEndingAlerts !== false) {
        const notif = await Notification.create({
          user: winner._id,
          type: 'auction_won',
          title: 'Congratulations! You won the auction!',
          message: `You won "${product.title}" with a final bid of ₹${product.currentBid.toLocaleString('en-IN')}. Connect with the seller to finalize handover.`,
          product: product._id
        });
        emitNotification(winner._id.toString(), notif.toJSON());
      }

      // Notify the seller of successful sale
      if (seller && seller.notificationPreferences?.auctionEndingAlerts !== false) {
        const notif = await Notification.create({
          user: seller._id,
          type: 'auction_ended',
          title: 'Auction Ended with Winning Bid',
          message: `Your listing "${product.title}" ended with a winning bid of ₹${product.currentBid.toLocaleString('en-IN')} from ${winner.fullName}.`,
          product: product._id
        });
        emitNotification(seller._id.toString(), notif.toJSON());
      }
    } else {
      // Notify the seller that no bids were placed
      if (seller && seller.notificationPreferences?.auctionEndingAlerts !== false) {
        const notif = await Notification.create({
          user: seller._id,
          type: 'auction_ended',
          title: 'Auction Ended - No Bids',
          message: `Your listing "${product.title}" has ended with no bids placed.`,
          product: product._id
        });
        emitNotification(seller._id.toString(), notif.toJSON());
      }
    }
  } catch (err) {
    console.error('Error sending auction ended notifications:', err.message);
  }
};
