import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useReducer,
  useCallback
} from 'react';
import {
  productsApi,
  bidsApi,
  notificationsApi
} from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const AuctionContext = createContext(null);

const initialFilterState = {
  category: 'all',
  status: 'live',
  sort: 'ending_soon',
  search: '',
  minPrice: '',
  maxPrice: '',
  page: 1,
  limit: 12
};

function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_CATEGORY':
      return { ...state, category: action.payload, page: 1 };
    case 'SET_STATUS':
      return { ...state, status: action.payload, page: 1 };
    case 'SET_SORT':
      return { ...state, sort: action.payload, page: 1 };
    case 'SET_SEARCH':
      return { ...state, search: action.payload, page: 1 };
    case 'SET_PRICE_RANGE':
      return { ...state, minPrice: action.payload.min, maxPrice: action.payload.max, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'RESET_FILTERS':
      return { ...initialFilterState };
    default:
      return state;
  }
}

export const AuctionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  // 1. Listings State with useReducer for filter changes
  const [filters, dispatchFilters] = useReducer(filterReducer, initialFilterState);
  const [listings, setListings] = useState([]);
  const [totalListings, setTotalListings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoadingListings(true);
      setListingsError(null);
      const res = await productsApi.getProducts(filters);
      if (res.success) {
        setListings(res.products || []);
        setTotalListings(res.total || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      setListingsError(err.message || 'Failed to load listings.');
    } finally {
      setLoadingListings(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // 2. Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoadingNotifications(true);
      const res = await notificationsApi.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Non-critical, ignore in background
    } finally {
      setLoadingNotifications(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markNotificationAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      showToast(err.message || 'Could not mark notification as read.', 'error');
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read.', 'info');
    } catch (err) {
      showToast(err.message || 'Could not update notifications.', 'error');
    }
  };

  // 3. User My Listings
  const [myListings, setMyListings] = useState([]);
  const [loadingMyListings, setLoadingMyListings] = useState(false);

  const fetchMyListings = useCallback(async () => {
    if (!isAuthenticated) {
      setMyListings([]);
      return;
    }
    try {
      setLoadingMyListings(true);
      const res = await productsApi.getMyProducts();
      if (res.success) {
        setMyListings(res.products || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch your listings.', 'error');
    } finally {
      setLoadingMyListings(false);
    }
  }, [isAuthenticated, showToast]);

  // 4. User My Bids
  const [myBids, setMyBids] = useState([]);
  const [loadingMyBids, setLoadingMyBids] = useState(false);

  const fetchMyBids = useCallback(async (filter = 'all') => {
    if (!isAuthenticated) {
      setMyBids([]);
      return;
    }
    try {
      setLoadingMyBids(true);
      const res = await bidsApi.getMyBids(filter);
      if (res.success) {
        setMyBids(res.bids || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch your bids.', 'error');
    } finally {
      setLoadingMyBids(false);
    }
  }, [isAuthenticated, showToast]);

  // 5. Product Actions
  const createListing = async (payload) => {
    try {
      const res = await productsApi.createProduct(payload);
      showToast(
        payload.isDraft ? 'Draft saved successfully!' : 'Listing submitted for admin moderation!',
        'success'
      );
      fetchMyListings();
      fetchListings();
      return res.product;
    } catch (err) {
      showToast(err.message || 'Failed to create listing.', 'error');
      throw err;
    }
  };

  const updateListing = async (id, payload) => {
    try {
      const res = await productsApi.updateProduct(id, payload);
      showToast('Listing updated successfully!', 'success');
      fetchMyListings();
      fetchListings();
      return res.product;
    } catch (err) {
      showToast(err.message || 'Failed to update listing.', 'error');
      throw err;
    }
  };

  const deleteListing = async (id) => {
    try {
      await productsApi.deleteProduct(id);
      showToast('Listing deleted successfully.', 'info');
      fetchMyListings();
      fetchListings();
    } catch (err) {
      showToast(err.message || 'Failed to delete listing.', 'error');
      throw err;
    }
  };

  const publishListing = async (id) => {
    try {
      await productsApi.publishProduct(id);
      showToast('Draft submitted for admin moderation!', 'success');
      fetchMyListings();
      fetchListings();
    } catch (err) {
      showToast(err.message || 'Failed to publish draft.', 'error');
      throw err;
    }
  };

  const placeBid = async (productId, amount) => {
    try {
      const res = await bidsApi.placeBid(productId, amount);
      showToast(res.message || 'Bid placed successfully!', 'success');
      fetchListings();
      fetchMyBids();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to place bid.', 'error');
      throw err;
    }
  };

  const reportListing = async (productId, reason) => {
    try {
      const res = await productsApi.reportProduct(productId, reason);
      showToast(res.message || 'Report submitted to campus moderators.', 'info');
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to submit report.', 'error');
      throw err;
    }
  };

  const updateListingBid = useCallback((productId, currentBid, bidCount) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, currentBid, bidCount, bidsCount: bidCount }
          : item
      )
    );
  }, []);

  const handleCatalogAuctionEnded = useCallback((productId) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, status: 'ended' } : item
      )
    );
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setUnreadCount((c) => c + 1);
  }, []);

  return (
    <AuctionContext.Provider
      value={{
        // Listings
        listings,
        totalListings,
        totalPages,
        loadingListings,
        listingsError,
        filters,
        dispatchFilters,
        refetchListings: fetchListings,
        updateListingBid,
        handleCatalogAuctionEnded,
        addNotification,

        // My Listings
        myListings,
        loadingMyListings,
        refetchMyListings: fetchMyListings,

        // My Bids
        myBids,
        loadingMyBids,
        refetchMyBids: fetchMyBids,

        // Notifications
        notifications,
        unreadCount,
        loadingNotifications,
        refetchNotifications: fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        // Actions
        createListing,
        updateListing,
        deleteListing,
        publishListing,
        placeBid,
        reportListing,

        // Toast passthrough
        toast,
        showToast,
        hideToast
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};
