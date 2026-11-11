/**
 * CampusBid - VESIT Online Auction System
 * Domain Types & API Contract Interfaces
 */

export type UserRole = 'student' | 'admin';

export interface UserStats {
  itemsSold: number;
  itemsBought: number;
  rating: number;
}

export interface NotificationPreferences {
  outbidAlerts: boolean;
  auctionEndingAlerts: boolean;
  newMessageAlerts: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  classBranch: string;
  rollNo: string;
  role: UserRole;
  isVerifiedStudent: boolean;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  memberSince: string;
  stats: UserStats;
  notificationPreferences: NotificationPreferences;
  createdAt: string;
}

export type ProductCategory =
  | 'all'
  | 'electronics'
  | 'books'
  | 'furniture'
  | 'fashion'
  | 'sports'
  | 'others';

export type ProductCondition =
  | 'new'
  | 'like-new'
  | 'good'
  | 'fair'
  | 'vintage'
  | 'Original Artwork'
  | 'Bronze Cast'
  | 'Marble Sculpture'
  | 'Painted Wood Sculpture';

export type AuctionStatus = 'live' | 'ended' | 'draft' | 'pending_approval';

export interface SellerSummary {
  id: string;
  name: string;
  isVerified: boolean;
  avatar?: string;
}

export interface WinningBidderSummary {
  id: string;
  name: string;
  amount: number;
}

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  condition: ProductCondition | string;
  description: string;
  images: string[];
  seller: SellerSummary;
  startingBid: number;
  currentBid: number;
  minIncrement: number;
  bidCount: number;
  status: AuctionStatus;
  endTime: string;
  createdAt: string;
  darkBg?: string;
  lightText?: boolean;
  winningBidder?: WinningBidderSummary | null;
}

export interface Bid {
  id: string;
  productId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
  timeAgo?: string;
}

export type BidStatus = 'Winning' | 'Outbid' | 'Ended' | 'Won';

export interface UserBidRecord {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  sellerName: string;
  sellerVerified: boolean;
  yourBid: number;
  highestBid: number;
  status: BidStatus;
  timeLeft: string;
  endTime: string;
}

export type NotificationType = 'outbid' | 'auction_won' | 'auction_ended' | 'new_bid';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  productId?: string;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  activeUsers: number;
  totalVolumeInr: number;
  pendingApprovals: number;
  flaggedListings: number;
  liveAuctions: number;
  completedAuctions: number;
}

export type ReportStatus = 'Reviewing' | 'Action Required' | 'Resolved';

export interface Report {
  id: string;
  productId: string;
  productTitle: string;
  reason: string;
  status: ReportStatus;
  reportedBy: string;
  reportedAt: string;
  comments?: string;
}

/* ---------------- API Request Payloads ---------------- */

export interface RegisterRequestPayload {
  fullName: string;
  email: string;
  classBranch: string;
  rollNo: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms: boolean;
}

export interface LoginRequestPayload {
  email: string;
  password?: string;
}

export interface CreateProductPayload {
  title: string;
  category: ProductCategory;
  condition: string;
  description: string;
  startingBid: number;
  minIncrement: number;
  duration: '24h' | '3d' | '7d';
  images: string[];
  isDraft?: boolean;
}

export interface PlaceBidPayload {
  amount: number;
}

export interface ModerateListingPayload {
  action: 'approve' | 'reject';
  reason?: string;
}

export interface ResolveReportPayload {
  resolutionAction: 'dismiss' | 'remove_listing' | 'suspend_user' | 'warn_seller';
  notes?: string;
}
