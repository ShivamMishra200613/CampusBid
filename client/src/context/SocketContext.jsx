import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useAuction } from './AuctionContext';

const SocketContext = createContext(null);

const getSocketUrl = () => {
  const customSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (customSocketUrl) return customSocketUrl;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return '/';
    }
  }
  return '/';
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { updateListingBid, handleCatalogAuctionEnded, addNotification } = useAuction();

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'

  useEffect(() => {
    const token = localStorage.getItem('campusbid_token');
    const socketUrl = getSocketUrl();

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: token || undefined },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      setStatus('connected');
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      setStatus(reason === 'io client disconnect' ? 'disconnected' : 'reconnecting');
    });

    newSocket.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    newSocket.on('reconnect', () => {
      setConnected(true);
      setStatus('connected');
    });

    // 8.8 Global notification handler: show toast & update badge
    newSocket.on('notification:new', (notif) => {
      if (addNotification) {
        addNotification(notif);
      }
      if (showToast) {
        showToast(
          notif.message || notif.title,
          notif.type === 'outbid' ? 'error' : notif.type === 'auction_won' ? 'success' : 'info'
        );
      }
    });

    // 8.9 Global catalog update: live card bid updates
    newSocket.on('catalog:bid_updated', ({ productId, currentBid, bidCount }) => {
      if (updateListingBid) {
        updateListingBid(productId, currentBid, bidCount);
      }
    });

    newSocket.on('catalog:auction_ended', ({ productId }) => {
      if (handleCatalogAuctionEnded) {
        handleCatalogAuctionEnded(productId);
      }
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, showToast, addNotification, updateListingBid, handleCatalogAuctionEnded]);

  const joinAuction = useCallback((productId) => {
    if (socket && productId) {
      socket.emit('auction:join', productId);
    }
  }, [socket]);

  const leaveAuction = useCallback((productId) => {
    if (socket && productId) {
      socket.emit('auction:leave', productId);
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        status,
        joinAuction,
        leaveAuction
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
