import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { validatePrice } from '../utils/validators';
import AuctionCard from '../components/AuctionCard';

export default function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, placeBid, showToast } = useAuction();
  const { isAuthenticated } = useAuth();

  const product = auctions.find((a) => a.id === id) || auctions[0];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Next minimum bid
  const minBid = (product?.currentBid || 0) + (product?.minIncrement || 50);
  const [bidAmount, setBidAmount] = useState(minBid);
  const [bidError, setBidError] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Counterfeit');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) {
    return (
      <div className="main-stage text-center py-20">
        <h2 className="font-headline-md text-2xl font-bold">Product not found</h2>
        <Link to="/" className="btn-primary mt-6">
          Back to Auctions
        </Link>
      </div>
    );
  }

  const isLive = product.status === 'live';
  const images = product.images && product.images.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800'
  ];

  const handleBidSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to place a bid.', 'error');
      navigate('/login');
      return;
    }

    const priceErr = validatePrice(bidAmount, 'Bid amount');
    if (priceErr) {
      setBidError(priceErr);
      return;
    }

    const num = Number(bidAmount);
    if (num < minBid) {
      setBidError(`Bid must be at least ₹${minBid.toLocaleString('en-IN')}`);
      return;
    }

    setBidError('');
    const success = placeBid(product.id, num);
    if (success) {
      setBidAmount(num + product.minIncrement);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setReportModalOpen(false);
    showToast('Listing reported to VESIT administration for moderation.', 'success');
  };

  const relatedProducts = auctions
    .filter((a) => a.id !== product.id && a.category === product.category)
    .slice(0, 4);

  return (
    <div className="w-full">
      <div className="main-stage">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-label-caps text-label-caps text-secondary hover:text-on-surface uppercase tracking-wider transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Catalog
          </Link>

          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-label-caps uppercase tracking-wider text-secondary hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">flag</span>
            Report Listing
          </button>
        </div>

        {/* Product Details Main Stage Card */}
        <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden p-6 md:p-10 lg:p-12 mb-16">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* --------------------------------------------------
                LEFT COLUMN: IMAGERY & THUMBNAILS
                -------------------------------------------------- */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              {/* Hero Image */}
              <div className="w-full aspect-[4/3] bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant relative group">
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {!isLive && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-6 py-2 bg-white text-black font-label-caps text-label-caps uppercase tracking-widest rounded-full font-bold shadow-lg">
                      Auction Ended
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border transition-all p-[1px] ${
                      activeImageIndex === idx
                        ? 'border-on-surface ring-2 ring-on-surface'
                        : 'border-outline-variant hover:border-on-surface'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover rounded-[6px]" />
                  </button>
                ))}
              </div>
            </div>

            {/* --------------------------------------------------
                RIGHT COLUMN: CONTENT & BIDDING HUB
                -------------------------------------------------- */}
            <div className="w-full lg:w-1/2 flex flex-col">
              {/* Category Meta */}
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-surface-container-high text-on-surface-variant font-label-caps text-[11px] uppercase tracking-widest rounded-full border border-outline-variant">
                  {product.category}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold mb-4 leading-tight">
                {product.title}
              </h1>

              {/* Seller Verification Info */}
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-surface-bright border border-outline-variant">
                <img
                  src={product.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={product.seller?.name || 'Seller'}
                  className="w-11 h-11 rounded-full object-cover border border-outline-variant"
                />
                <div className="flex flex-col">
                  <span className="font-body-md text-base font-semibold text-on-surface">
                    {product.seller?.name || 'Alex V.'}
                  </span>
                  <div className="flex items-center text-tertiary gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="font-body-sm text-[12px] font-medium">
                      Verified VESIT Student • Batch 2026
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="prose text-on-surface-variant font-body-md leading-relaxed mb-6">
                <p className="text-sm md:text-base">{product.description}</p>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-widest">
                  Condition: <strong className="font-bold">{product.condition}</strong>
                </span>
              </div>

              <hr className="border-t border-outline-variant mb-6" />

              {/* Bidding Section */}
              <div className="flex flex-col gap-6 mb-8 bg-surface-bright p-6 rounded-xl border border-outline-variant">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h3 className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-1">
                      Current Highest Bid
                    </h3>
                    <div className="font-price-display text-[32px] md:text-[40px] font-bold text-on-surface leading-none tracking-tight">
                      ₹{(product.currentBid || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="font-body-sm text-xs text-secondary mt-1 block">
                      Starting Bid: ₹{(product.startingBid || 0).toLocaleString('en-IN')} • Min Increment: ₹{product.minIncrement || 50}
                    </span>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    <span
                      className={`px-3 py-1 text-white font-label-caps text-[10px] uppercase tracking-widest rounded-full ${
                        isLive ? 'bg-[#4CAF50]' : 'bg-secondary'
                      }`}
                    >
                      {isLive ? 'Live' : 'Ended'}
                    </span>
                    <div className="font-body-md text-sm text-on-surface font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        schedule
                      </span>
                      <span>02h : 15m : 45s left</span>
                    </div>
                  </div>
                </div>

                {/* Bid Form */}
                {isLive ? (
                  <div>
                    <form onSubmit={handleBidSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                      <div className="relative flex-grow">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-lg text-secondary">
                          ₹
                        </span>
                        <input
                          id="bidAmount"
                          data-testid="bid-amount-input"
                          type="number"
                          min={minBid}
                          step={product.minIncrement || 50}
                          value={bidAmount}
                          onChange={(e) => {
                            setBidAmount(e.target.value);
                            if (bidError) setBidError('');
                          }}
                          placeholder={`Min. ${minBid}`}
                          required
                          className={`w-full h-14 pl-9 pr-4 bg-surface rounded-full border ${bidError ? 'border-red-500' : 'border-outline-variant'} focus:border-on-surface focus:ring-1 focus:ring-on-surface font-body-md text-base text-on-surface transition-colors`}
                        />
                      </div>
                      <button
                        type="submit"
                        data-testid="place-bid-button"
                        className="h-14 px-8 bg-on-surface text-white rounded-full font-label-caps text-label-caps uppercase tracking-widest hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm"
                      >
                        Place Bid
                      </button>
                    </form>
                    {bidError && (
                      <p data-testid="bid-amount-error" className="mt-2 ml-4 text-xs text-red-500 font-body-sm">
                        {bidError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-surface-container rounded-lg text-center font-body-sm text-secondary">
                    This auction has officially closed. Winning Bidder: <strong className="text-black">{product.winningBidder?.name || 'Alex Mercer'} (₹{product.currentBid?.toLocaleString('en-IN')})</strong>
                  </div>
                )}
              </div>

              {/* Expandable Bid History */}
              <details className="group border border-outline-variant rounded-xl p-4 bg-surface-bright" open>
                <summary className="flex justify-between items-center cursor-pointer font-label-caps text-label-caps uppercase tracking-widest text-on-surface list-none">
                  <span>Bid History ({product.bids?.length || 0})</span>
                  <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[20px]">
                    expand_more
                  </span>
                </summary>

                <div className="pt-4 overflow-x-auto">
                  {product.bids && product.bids.length > 0 ? (
                    <table className="w-full text-left font-body-sm text-sm text-on-surface">
                      <thead>
                        <tr className="border-b border-outline-variant text-secondary font-label-caps text-[11px] uppercase">
                          <th className="py-2">Bidder</th>
                          <th className="py-2">Amount</th>
                          <th className="py-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {product.bids.map((b, idx) => (
                          <tr key={b.id || idx} className="hover:bg-surface transition-colors">
                            <td className="py-2.5 font-medium flex items-center gap-1.5">
                              {idx === 0 && (
                                <span className="w-2 h-2 rounded-full bg-[#4CAF50]"></span>
                              )}
                              {b.bidderName}
                            </td>
                            <td className="py-2.5 font-price-display font-semibold">
                              ₹{(b.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 text-right text-secondary font-mono text-xs">
                              {b.timeAgo || 'Recent'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-secondary text-sm italic py-2">No bids recorded yet. Be the first to bid!</p>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-outline-variant">
              <h2 className="font-headline-md text-2xl font-bold text-on-surface">
                Similar Campus Listings
              </h2>
              <Link
                to="/"
                className="font-label-caps text-label-caps uppercase tracking-wider text-secondary hover:text-black"
              >
                View Catalog →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <AuctionCard key={rel.id} item={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                Report Listing
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-secondary hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="editorial-label">Reason for reporting</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="editorial-input"
                >
                  <option value="Counterfeit">Counterfeit / Fake Item</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Misleading Information">Misleading / Inaccurate Info</option>
                  <option value="Prohibited Item">Prohibited Item</option>
                  <option value="Other">Other Violation</option>
                </select>
              </div>
              <div>
                <label className="editorial-label">Additional details</label>
                <textarea
                  rows="3"
                  placeholder="Explain why this listing violates campus guidelines..."
                  className="w-full rounded-xl border border-outline-variant p-3 font-body-md text-sm outline-none focus:border-on-surface"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
