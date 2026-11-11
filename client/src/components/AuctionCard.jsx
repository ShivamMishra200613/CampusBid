import React from 'react';
import { Link } from 'react-router-dom';

export default function AuctionCard({ item }) {
  const isLive = item.status === 'live';
  const sellerName = item.seller?.name || item.seller || 'VESIT Student';
  const isVerified = item.seller?.isVerified ?? true;

  return (
    <Link
      to={`/auctions/${item.id}`}
      data-testid="auction-card"
      className="group block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-on-surface"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-[#F5F5F5] overflow-hidden">
        <img
          src={item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
          alt={item.title}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !isLive ? 'grayscale' : ''
          }`}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <span
            className={`px-3 py-1 rounded-full font-label-caps text-[10px] uppercase tracking-widest text-white flex items-center gap-1 ${
              isLive ? 'bg-[#4CAF50]' : 'bg-secondary'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            {isLive ? 'Live' : 'Ended'}
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <span className="bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-outline-variant font-label-caps text-[10px] uppercase tracking-widest text-on-surface">
            {item.category}
          </span>
        </div>

        {/* Hover Bid Button Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end p-3">
          <span className="bg-on-surface text-white px-4 py-2 rounded-full font-label-caps text-[11px] uppercase tracking-wider shadow-md hover:bg-gray-800 transition-colors">
            {isLive ? 'Bid Now →' : 'View Details →'}
          </span>
        </div>
      </div>

      {/* Content / Metadata Section */}
      <div className="p-4 flex flex-col gap-2.5 bg-surface-container-lowest">
        {/* Title */}
        <h3 className="font-headline-md text-[18px] md:text-[20px] leading-snug text-on-surface font-bold line-clamp-1 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Hairline Divider */}
        <div className="border-t border-outline-variant"></div>

        {/* Meta Info Grid */}
        <div className="flex justify-between items-center text-[13px]">
          <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider">
            Seller
          </span>
          <span className="font-body-md text-sm font-medium text-on-surface flex items-center gap-1">
            {sellerName}
            {isVerified && (
              <span className="material-symbols-outlined text-[14px] text-tertiary">
                verified
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center text-[13px]">
          <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider">
            Condition
          </span>
          <span className="font-body-md text-sm text-on-surface-variant">
            {item.condition}
          </span>
        </div>

        {/* Hairline Divider */}
        <div className="border-t border-outline-variant"></div>

        {/* Price Row */}
        <div className="flex justify-between items-end pt-1">
          <div>
            <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block mb-0.5">
              Current Bid
            </span>
            <span className="font-price-display text-price-display font-bold text-on-surface">
              ₹{(item.currentBid || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="font-body-sm text-[12px] text-secondary">
              {item.bidCount ?? item.bidsCount ?? item.bids?.length ?? 0} bids placed
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
