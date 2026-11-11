import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { productsApi } from '../api/client';
import { validatePrice } from '../utils/validators';
import AuctionCard from '../components/AuctionCard';

export default function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { placeBid, reportListing, showToast } = useAuction();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [recentBids, setRecentBids] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Counterfeit');
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [timeLeftString, setTimeLeftString] = useState('');

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getProductById(id);
      if (res.success && res.product) {
        setProduct(res.product);
        setRecentBids(res.recentBids || []);

        const nextMin = (res.product.currentBid || 0) + (res.product.minIncrement || 50);
        setBidAmount(String(nextMin));

        // Load related items in same category
        if (res.product.category) {
          productsApi.getProducts({ category: res.product.category, limit: 5 })
            .then((catRes) => {
              if (catRes.success && catRes.products) {
                setRelatedProducts(catRes.products.filter((p) => p.id !== res.product.id).slice(0, 4));
              }
            })
            .catch(() => {});
        }
      } else {
        setError('Product not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load auction details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProduct();
  }, [loadProduct]);

  // Live countdown timer
  useEffect(() => {
    if (!product || product.status !== 'live' || !product.endTime) {
      setTimeLeftString('Ended');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(product.endTime) - Date.now();
      if (diff <= 0) {
        setTimeLeftString('Ended');
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeftString(`${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [product]);

  if (loading) {
    return (
      <div data-testid="detail-loading" className="main-stage text-center py-24 text-secondary">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        <p className="mt-2 font-body-sm text-sm">Loading artifact details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div data-testid="detail-error" className="main-stage text-center py-20">
        <span className="material-symbols-outlined text-5xl text-error mb-2">error</span>
        <h2 className="font-headline-md text-2xl font-bold">{error || 'Product not found'}</h2>
        <Link to="/" className="btn-primary mt-6 inline-block">
          Back to Auctions
        </Link>
      </div>
    );
  }

  const isLive = product.status === 'live' && timeLeftString !== 'Ended';
  const minBid = (product.currentBid || 0) + (product.minIncrement || 50);
  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];

  const isSeller = user && (user.id === product.seller?.id || user.id === product.seller);
  const isHighestBidder = user && (user.id === product.highestBidder?.id || user.id === product.highestBidder);
  const hasUserBid = user && recentBids.some((b) => b.bidderId === user.id);
  const isOutbid = hasUserBid && !isHighestBidder && isLive;

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to place a bid.', 'error');
      navigate('/login');
      return;
    }

    if (isSeller) {
      setBidError('Sellers cannot bid on their own listings.');
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
    setIsSubmittingBid(true);

    try {
      await placeBid(product.id, num);
      await loadProduct();
    } catch (err) {
      setBidError(err.message || 'Bid submission failed.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to report a listing.', 'error');
      navigate('/login');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const fullReason = reportNotes.trim() ? `${reportReason}: ${reportNotes.trim()}` : reportReason;
      await reportListing(product.id, fullReason);
      setReportModalOpen(false);
      setReportNotes('');
    } catch {
      // Error handled in context toast
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="w-full">
      <div className="main-stage">
        {/* Back Link & Report Button */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-label-caps text-label-caps text-secondary hover:text-on-surface uppercase tracking-wider transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Catalog
          </Link>

          {!isSeller && (
            <button
              onClick={() => setReportModalOpen(true)}
              data-testid="report-listing-button"
              className="inline-flex items-center gap-1 text-[11px] font-label-caps uppercase tracking-wider text-secondary hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">flag</span>
              Report Listing
            </button>
          )}
        </div>

        {/* User Bidding Status Alerts */}
        {isHighestBidder && isLive && (
          <div data-testid="winning-badge" className="mb-6 p-4 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/30 text-[#2e7d32] flex items-center gap-2 font-body-sm font-semibold">
            <span className="material-symbols-outlined text-xl">verified</span>
            <span>You are currently the highest bidder on this artifact!</span>
          </div>
        )}

        {isOutbid && (
          <div data-testid="outbid-badge" className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-center gap-2 font-body-sm font-semibold">
            <span className="material-symbols-outlined text-xl">warning</span>
            <span>You have been outbid! Place a higher bid to regain the lead.</span>
          </div>
        )}

        {/* Product Details Main Stage Card */}
        <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden p-6 md:p-10 lg:p-12 mb-16 shadow-sm">
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
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
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
              )}
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
                    {product.seller?.name || 'VESIT Student'}
                  </span>
                  <div className="flex items-center text-tertiary gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="font-body-sm text-[12px] font-medium">
                      Verified VESIT Student
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
                      <span>{timeLeftString}</span>
                    </div>
                  </div>
                </div>

                {/* Bid Form or Seller Notice */}
                {isSeller ? (
                  <div className="p-4 bg-surface-container rounded-lg text-center font-body-sm text-secondary">
                    You listed this auction. Sellers cannot bid on their own listings.
                  </div>
                ) : isLive ? (
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
                        disabled={isSubmittingBid}
                        data-testid="place-bid-button"
                        className="h-14 px-8 bg-on-surface text-white rounded-full font-label-caps text-label-caps uppercase tracking-widest hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                      >
                        {isSubmittingBid ? 'Placing...' : 'Place Bid'}
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
                    This auction has closed.{' '}
                    {product.winner ? (
                      <span>
                        Winner: <strong className="text-black">{product.winner.fullName || 'Student'}</strong> (₹{(product.currentBid || 0).toLocaleString('en-IN')})
                      </span>
                    ) : (
                      <span>No bids were placed.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Expandable Bid History */}
              <details className="group border border-outline-variant rounded-xl p-4 bg-surface-bright" open>
                <summary className="flex justify-between items-center cursor-pointer font-label-caps text-label-caps uppercase tracking-widest text-on-surface list-none">
                  <span>Bid History ({recentBids.length})</span>
                  <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[20px]">
                    expand_more
                  </span>
                </summary>

                <div className="pt-4 overflow-x-auto">
                  {recentBids.length > 0 ? (
                    <table className="w-full text-left font-body-sm text-sm text-on-surface">
                      <thead>
                        <tr className="border-b border-outline-variant text-secondary font-label-caps text-[11px] uppercase">
                          <th className="py-2">Bidder</th>
                          <th className="py-2">Amount</th>
                          <th className="py-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {recentBids.map((b, idx) => (
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
                              {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
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
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
