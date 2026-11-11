import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';

export default function MyListingsPage() {
  const { myListings, loadingMyListings, refetchMyListings, publishListing, deleteListing } =
    useAuction();

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    refetchMyListings();
  }, [refetchMyListings]);

  const liveItems = myListings.filter((a) => a.status === 'live');
  const endedItems = myListings.filter((a) => a.status === 'ended');
  const draftItems = myListings.filter((a) => a.status === 'draft');
  const pendingItems = myListings.filter((a) => a.status === 'pending_approval');

  const getFilteredItems = () => {
    if (activeTab === 'active') return liveItems;
    if (activeTab === 'ended') return endedItems;
    if (activeTab === 'drafts') return draftItems;
    if (activeTab === 'pending') return pendingItems;
    return myListings;
  };

  const items = getFilteredItems();

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this listing?')) {
      await deleteListing(id);
    }
  };

  const handlePublish = async (id) => {
    await publishListing(id);
  };

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

          <Link to="/create" className="btn-primary" data-testid="create-new-listing-btn">
            + New Listing
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-outline-variant">
          {[
            { key: 'all', label: 'All Items', count: myListings.length },
            { key: 'active', label: 'Active Live', count: liveItems.length },
            { key: 'pending', label: 'Pending Approval', count: pendingItems.length },
            { key: 'ended', label: 'Ended / Sold', count: endedItems.length },
            { key: 'drafts', label: 'Drafts', count: draftItems.length }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`font-label-caps text-label-caps uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-black text-white font-bold'
                  : 'bg-surface-bright text-secondary hover:text-black border border-outline-variant'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Loading / Empty / Content states */}
        {loadingMyListings ? (
          <div data-testid="my-listings-loading" className="py-20 text-center text-secondary">
            <span className="material-symbols-outlined text-4xl animate-spin">
              progress_activity
            </span>
            <p className="mt-2 font-body-sm text-sm">Loading your listings...</p>
          </div>
        ) : items.length === 0 ? (
          <div
            data-testid="my-listings-empty"
            className="py-20 text-center border border-dashed border-outline-variant rounded-2xl bg-surface-bright"
          >
            <span className="material-symbols-outlined text-[48px] text-secondary mb-2">
              inventory_2
            </span>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">
              No listings in this category
            </h3>
            <p className="font-body-md text-secondary mt-1">
              Have unwanted textbooks or gadgets? Put them up for auction today.
            </p>
            <Link to="/create" className="btn-primary mt-6 inline-block">
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {items.map((item) => {
              const isDraft = item.status === 'draft';
              const isEnded = item.status === 'ended';
              const isLive = item.status === 'live';
              const isPending = item.status === 'pending_approval';

              return (
                <div
                  key={item.id}
                  data-testid="my-listing-card"
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
                      src={
                        item.images?.[0] ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
                      }
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

                    {/* Delete action button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      data-testid="delete-listing-button"
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
                          <span className="inline-flex items-center gap-1 font-label-caps text-[10px] bg-[#4CAF50] text-white px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>{' '}
                            Live
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 font-label-caps text-[10px] bg-[#f59e0b] text-white px-2.5 py-0.5 rounded-full">
                            Under Review
                          </span>
                        )}
                        {isEnded && (
                          <span className="inline-flex items-center gap-1 font-label-caps text-[10px] bg-surface-container-high text-secondary px-2.5 py-0.5 rounded-full">
                            Ended
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
                        <div className="flex gap-2">
                          <Link
                            to={`/create?edit=${item.id}`}
                            data-testid="edit-listing-button"
                            className="flex-1 py-2 border border-outline-variant rounded-full font-label-caps text-[11px] uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1 text-on-surface"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handlePublish(item.id)}
                            data-testid="publish-draft-button"
                            className="flex-1 py-2 bg-on-surface text-white rounded-full font-label-caps text-[11px] uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">publish</span>
                            Submit
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {(isPending ||
                            (isLive && (item.bidsCount === 0 || item.bids?.length === 0))) && (
                            <Link
                              to={`/create?edit=${item.id}`}
                              data-testid="edit-listing-button"
                              className="flex-1 py-2 border border-outline-variant rounded-full font-label-caps text-[11px] uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1 text-on-surface"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              Edit
                            </Link>
                          )}
                          <Link
                            to={`/auctions/${item.id}`}
                            className="flex-1 py-2 border border-outline-variant rounded-full font-label-caps text-[11px] uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 text-on-surface"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isEnded ? 'receipt_long' : 'visibility'}
                            </span>
                            {isEnded ? 'View Result' : 'View Listing'}
                          </Link>
                        </div>
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
