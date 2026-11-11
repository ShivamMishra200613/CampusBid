import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';

export default function MyListingsPage() {
  const { auctions, myDrafts, publishDraft, deleteListing } = useAuction();
  const [activeTab, setActiveTab] = useState('all');

  // Listings by logged-in user
  const userLiveAuctions = auctions.filter((a) => a.status === 'live');
  const userEndedAuctions = auctions.filter((a) => a.status === 'ended');

  const getFilteredItems = () => {
    if (activeTab === 'active') return userLiveAuctions;
    if (activeTab === 'ended') return userEndedAuctions;
    if (activeTab === 'drafts') return myDrafts;
    return [...userLiveAuctions, ...userEndedAuctions, ...myDrafts];
  };

  const items = getFilteredItems();

  return (
    <div className="w-full">
      <div className="main-stage">
        {/* Header with Title and Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-outline-variant">
          <div>
            <h1 className="font-headline-lg text-[28px] md:text-headline-lg font-bold text-on-surface leading-tight">
              My Auction Listings
            </h1>
            <p className="font-body-md text-secondary mt-1">
              Manage your active auctions, past sales, and pending draft listings.
            </p>
          </div>

          <Link to="/create" className="btn-primary">
            + New Listing
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-outline-variant">
          {[
            { key: 'all', label: 'All Items', count: userLiveAuctions.length + userEndedAuctions.length + myDrafts.length },
            { key: 'active', label: 'Active Live', count: userLiveAuctions.length },
            { key: 'ended', label: 'Ended / Sold', count: userEndedAuctions.length },
            { key: 'drafts', label: 'Drafts', count: myDrafts.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-label-caps text-label-caps uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors ${
                activeTab === tab.key
                  ? 'bg-black text-white font-bold'
                  : 'bg-surface-bright text-secondary hover:text-black border border-outline-variant'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {items.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-outline-variant rounded-2xl bg-surface-bright">
            <span className="material-symbols-outlined text-[48px] text-secondary mb-2">
              inventory_2
            </span>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">
              No listings in this category
            </h3>
            <p className="font-body-md text-secondary mt-1">
              Have unwanted textbooks or gadgets? Put them up for auction today.
            </p>
            <Link to="/create" className="btn-primary mt-6">
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {items.map((item) => {
              const isDraft = item.status === 'draft';
              const isEnded = item.status === 'ended';
              const isLive = item.status === 'live';

              return (
                <div
                  key={item.id}
                  className={`group border rounded-xl overflow-hidden bg-surface-container-lowest transition-all hover:shadow-md ${
                    isDraft
                      ? 'border-dashed border-outline-variant bg-surface-bright'
                      : isEnded
                      ? 'border-outline-variant opacity-85'
                      : 'border-outline-variant'
                  }`}
                >
                  {/* Image Area */}
                  <div className="relative w-full aspect-square bg-surface-container-low overflow-hidden">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                      alt={item.title}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        isEnded ? 'grayscale' : ''
                      }`}
                    />

                    {/* Category Tag */}
                    <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full border border-outline-variant">
                      <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface">
                        {item.category}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isEnded && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-surface-container-lowest text-on-surface font-label-caps text-xs px-4 py-1.5 rounded-full border border-outline-variant font-bold shadow-md">
                          SOLD
                        </span>
                      </div>
                    )}

                    {/* Delete action button */}
                    <button
                      onClick={() => deleteListing(item.id)}
                      title="Delete Listing"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-secondary hover:text-error flex items-center justify-center border border-outline-variant shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col gap-2.5">
                    <h3 className="font-headline-md text-[18px] leading-tight text-on-surface font-bold line-clamp-1">
                      {item.title}
                    </h3>

                    <div className="border-t border-outline-variant my-0.5"></div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-label-caps text-[10px] text-secondary uppercase tracking-wider mb-0.5">
                          {isEnded ? 'Winning Bid' : isDraft ? 'Starting At' : 'Current Bid'}
                        </p>
                        <p className="font-price-display text-price-display font-bold text-on-surface">
                          ₹{(item.currentBid || item.startingBid || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="text-right">
                        {isLive && (
                          <>
                            <span className="inline-flex items-center gap-1 font-label-caps text-[10px] bg-[#4CAF50] text-white px-2.5 py-0.5 rounded-full mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Live
                            </span>
                            <p className="font-body-sm text-xs text-secondary">02h : 15m left</p>
                          </>
                        )}
                        {isEnded && (
                          <span className="inline-flex items-center gap-1 font-label-caps text-[10px] bg-surface-container-high text-secondary px-2.5 py-0.5 rounded-full">
                            Completed
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 font-label-caps text-[10px] bg-primary-fixed text-on-primary-fixed px-2.5 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    <div className="pt-2">
                      {isDraft ? (
                        <button
                          onClick={() => publishDraft(item.id)}
                          className="w-full py-2 bg-on-surface text-white rounded-full font-label-caps text-[11px] uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">publish</span>
                          Publish Listing
                        </button>
                      ) : (
                        <Link
                          to={`/auctions/${item.id}`}
                          className="w-full py-2 border border-outline-variant rounded-full font-label-caps text-[11px] uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isEnded ? 'receipt_long' : 'visibility'}
                          </span>
                          {isEnded ? 'View Receipt' : 'View Live Listing'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
