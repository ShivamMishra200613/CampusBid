import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';

export default function MyBidsPage() {
  const { myBids, loadingMyBids, refetchMyBids } = useAuction();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    refetchMyBids(filter);
  }, [filter, refetchMyBids]);

  const winningCount = myBids.filter((b) => b.status === 'Winning').length;
  const outbidCount = myBids.filter((b) => b.status === 'Outbid').length;
  const endedCount = myBids.filter(
    (b) => b.status === 'Ended' || b.status === 'Won' || b.status === 'Lost'
  ).length;

  return (
    <div className="w-full">
      <div className="main-stage">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-outline-variant">
          <div>
            <h1 className="font-headline-lg text-[28px] md:text-headline-lg font-bold text-on-surface leading-tight">
              My Auction Bids
            </h1>
            <p className="font-body-md text-secondary mt-1">
              Track live auctions you're competing in, outbid alerts, and won items.
            </p>
          </div>

          <Link to="/" className="btn-secondary">
            Browse More Auctions
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-outline-variant">
          {[
            { key: 'all', label: 'All Bids', count: myBids.length },
            { key: 'winning', label: 'Winning', count: winningCount },
            { key: 'outbid', label: 'Outbid', count: outbidCount },
            { key: 'ended', label: 'Won / Ended', count: endedCount }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`font-label-caps text-label-caps uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-black text-white font-bold'
                  : 'bg-surface-bright text-secondary hover:text-black border border-outline-variant'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Loading / Empty / Content states */}
        {loadingMyBids ? (
          <div data-testid="my-bids-loading" className="py-20 text-center text-secondary">
            <span className="material-symbols-outlined text-4xl animate-spin">
              progress_activity
            </span>
            <p className="mt-2 font-body-sm text-sm">Loading your bids...</p>
          </div>
        ) : myBids.length === 0 ? (
          <div
            data-testid="my-bids-empty"
            className="py-20 text-center border border-dashed border-outline-variant rounded-2xl bg-surface-bright"
          >
            <span className="material-symbols-outlined text-[48px] text-secondary mb-2">gavel</span>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">
              No bids found in this filter
            </h3>
            <p className="font-body-md text-secondary mt-1">
              Find an active auction and place your bid to start competing.
            </p>
            <Link to="/" className="btn-primary mt-6 inline-block">
              Explore Live Auctions
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-outline-variant rounded-2xl bg-surface-container-lowest shadow-sm mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-secondary font-label-caps text-label-caps uppercase tracking-wider bg-surface-bright">
                  <th className="py-4 px-6 w-1/3">Item</th>
                  <th className="py-4 px-4">Seller</th>
                  <th className="py-4 px-4">Your Bid</th>
                  <th className="py-4 px-4">Highest Bid</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Time Left</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="font-body-md text-sm divide-y divide-outline-variant">
                {myBids.map((bid) => {
                  const isWinning = bid.status === 'Winning';
                  const isOutbid = bid.status === 'Outbid';

                  return (
                    <tr
                      key={bid.id}
                      data-testid="bid-row"
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      {/* Item Thumbnail & Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#F5F5F5] overflow-hidden shrink-0 border border-outline-variant">
                            <img
                              src={
                                bid.productImage ||
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'
                              }
                              alt={bid.productTitle}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Link
                            to={`/auctions/${bid.productId}`}
                            className="font-headline-md text-[16px] leading-snug font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1"
                          >
                            {bid.productTitle}
                          </Link>
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="py-4 px-4 text-on-surface-variant font-medium">
                        <div className="flex items-center gap-1">
                          {bid.sellerName}
                          {bid.sellerVerified && (
                            <span className="material-symbols-outlined text-tertiary text-[16px]">
                              verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Your Bid */}
                      <td className="py-4 px-4 font-price-display font-semibold text-on-surface">
                        <span className={isOutbid ? 'line-through text-secondary' : ''}>
                          ₹{(bid.yourBid || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Highest Bid */}
                      <td className="py-4 px-4 font-price-display font-bold text-on-surface">
                        ₹{(bid.highestBid || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-label-caps text-[10px] uppercase tracking-wider ${
                            isWinning
                              ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/40 font-bold'
                              : isOutbid
                                ? 'bg-error-container/40 text-error border border-error/40 font-bold animate-pulse'
                                : 'bg-surface-container-high text-secondary border border-outline-variant font-bold'
                          }`}
                        >
                          {bid.status}
                        </span>
                      </td>

                      {/* Time Left */}
                      <td className="py-4 px-4 font-mono text-xs text-on-surface-variant">
                        {bid.timeLeft}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        {isOutbid ? (
                          <Link
                            to={`/auctions/${bid.productId}`}
                            className="inline-flex items-center gap-1 font-label-caps text-xs font-bold text-primary hover:text-black uppercase tracking-wider underline"
                          >
                            Bid Again →
                          </Link>
                        ) : (
                          <Link
                            to={`/auctions/${bid.productId}`}
                            className="font-label-caps text-xs text-secondary hover:text-black uppercase tracking-wider underline"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
