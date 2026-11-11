import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import User from '../models/User.js';

let ioInstance = null;

export const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin || 'http://localhost:5173',
      credentials: true
    }
  });

  ioInstance = io;

  // Socket Auth Middleware: verify JWT from handshake auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwtSecret);
          if (decoded && decoded.sub) {
            const user = await User.findById(decoded.sub).select('_id email role fullName isSuspended');
            if (user && !user.isSuspended) {
              socket.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                fullName: user.fullName
              };
            }
          }
        } catch {
          // Invalid or expired token: anonymous socket
          socket.user = null;
        }
      } else {
        socket.user = null;
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // Track viewer counts per auction: Map(productId => Set(socketId))
  const auctionViewers = new Map();

  const getViewerCount = (productId) => {
    return auctionViewers.get(productId)?.size || 0;
  };

  io.on('connection', (socket) => {
    // 8.3 Automatically join private user room if authenticated
    if (socket.user && socket.user.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Explicit room join request
    socket.on('join', (room) => {
      if (typeof room === 'string' && room.startsWith('user:')) {
        const targetUserId = room.split(':')[1];
        if (!socket.user || socket.user.id !== targetUserId) {
          socket.emit('error', {
            code: 'UNAUTHORIZED_ROOM',
            message: 'Cannot join user room without authentication.'
          });
          return;
        }
      }
      socket.join(room);
    });

    // 8.5 Client events: auction:join
    socket.on('auction:join', (productId) => {
      if (!productId) return;
      const room = `auction:${productId}`;
      socket.join(room);

      if (!auctionViewers.has(productId)) {
        auctionViewers.set(productId, new Set());
      }
      auctionViewers.get(productId).add(socket.id);

      io.to(room).emit('auction:viewers', {
        productId,
        viewerCount: getViewerCount(productId)
      });
    });

    // 8.5 Client events: auction:leave
    socket.on('auction:leave', (productId) => {
      if (!productId) return;
      const room = `auction:${productId}`;
      socket.leave(room);

      if (auctionViewers.has(productId)) {
        auctionViewers.get(productId).delete(socket.id);
        if (auctionViewers.get(productId).size === 0) {
          auctionViewers.delete(productId);
        }
      }

      io.to(room).emit('auction:viewers', {
        productId,
        viewerCount: getViewerCount(productId)
      });
    });

    // Clean up viewers when a client disconnects
    socket.on('disconnect', () => {
      auctionViewers.forEach((viewers, productId) => {
        if (viewers.has(socket.id)) {
          viewers.delete(socket.id);
          const room = `auction:${productId}`;
          io.to(room).emit('auction:viewers', {
            productId,
            viewerCount: viewers.size
          });
          if (viewers.size === 0) {
            auctionViewers.delete(productId);
          }
        }
      });
    });
  });

  return io;
};

export const getIO = () => ioInstance;

// Helper broadcast functions
export const emitNewBid = ({ productId, bid, currentBid, bidCount, highestBidder }) => {
  if (!ioInstance) return;
  ioInstance.to(`auction:${productId}`).emit('bid:new', {
    productId,
    bid,
    currentBid,
    bidCount,
    highestBidder
  });
  ioInstance.emit('catalog:bid_updated', {
    productId,
    currentBid,
    bidCount
  });
};

export const emitAuctionEnded = ({ productId, winner, winningBid }) => {
  if (!ioInstance) return;
  ioInstance.to(`auction:${productId}`).emit('auction:ended', {
    productId,
    winner,
    winningBid
  });
  ioInstance.emit('catalog:auction_ended', {
    productId
  });
};

export const emitNotification = (userId, notification) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit('notification:new', notification);
};
