import Product from '../models/Product.js';
import { notifyAuctionEnded } from './notifier.js';
import { config } from '../config/config.js';
import { emitAuctionEnded } from '../sockets/index.js';

/**
 * Checks for live auctions whose endTime has arrived or passed,
 * atomically updates their status to 'ended', assigns winner,
 * and notifies seller and winning student.
 * Safe to run multiple times concurrently or sequentially.
 */
export const closeExpiredAuctions = async () => {
  const now = new Date();

  // Find all candidate live auctions whose endTime <= now
  const candidates = await Product.find({
    status: 'live',
    endTime: { $lte: now }
  });

  const closedProducts = [];

  for (const candidate of candidates) {
    // Idempotent atomic transition: only update if status is still 'live'
    const updated = await Product.findOneAndUpdate(
      {
        _id: candidate._id,
        status: 'live'
      },
      {
        $set: {
          status: 'ended',
          winner: candidate.highestBidder || null
        }
      },
      { new: true }
    );

    if (updated) {
      await notifyAuctionEnded(updated);
      emitAuctionEnded({
        productId: updated.id,
        winner: updated.winner,
        winningBid: updated.currentBid
      });
      closedProducts.push(updated);
    }
  }

  return closedProducts;
};

let sweeperTimer = null;

/**
 * Starts the periodic auction closing sweeper.
 * Must only be invoked from server.js (never app.js).
 */
export const startAuctionSweeper = (intervalMs = config.auctionSweepMs) => {
  if (sweeperTimer) return;

  sweeperTimer = setInterval(async () => {
    try {
      await closeExpiredAuctions();
    } catch (err) {
      console.error('Auction sweeper interval error:', err.message);
    }
  }, intervalMs);

  return sweeperTimer;
};

/**
 * Stops the periodic auction sweeper (useful for graceful shutdown or tests).
 */
export const stopAuctionSweeper = () => {
  if (sweeperTimer) {
    clearInterval(sweeperTimer);
    sweeperTimer = null;
  }
};
