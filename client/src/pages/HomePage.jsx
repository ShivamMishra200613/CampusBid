import React from 'react';
import { useAuction } from '../context/AuctionContext';
import AuctionCard from '../components/AuctionCard';
import { CATEGORIES, SORT_OPTIONS } from '../utils/constants';

export default function HomePage() {
  const {
    listings,
    totalListings,
    totalPages,
    loadingListings,
    listingsError,
    filters,
    dispatchFilters,
    refetchListings
  } = useAuction();

  const handleCategorySelect = (catKey) => {
    dispatchFilters({ type: 'SET_CATEGORY', payload: catKey });
  };

  const handleStatusSelect = (status) => {
    dispatchFilters({ type: 'SET_STATUS', payload: status });
  };

  const handleSortSelect = (e) => {
    dispatchFilters({ type: 'SET_SORT', payload: e.target.value });
  };

  const handleSearchChange = (e) => {
    dispatchFilters({ type: 'SET_SEARCH', payload: e.target.value });
  };

  const handleResetFilters = () => {
    dispatchFilters({ type: 'RESET_FILTERS' });
  };

  const handlePageChange = (newPage) => {
    dispatchFilters({ type: 'SET_PAGE', payload: newPage });
  };

  return (
    <div className="w-full">
      {/* The Main Stage Container */}
      <div className="main-stage">
        {/* =========================================================
            1. HERO SECTION
            ========================================================= */}
        <div className="relative w-full rounded-2xl overflow-hidden min-h-[480px] md:min-h-[540px] flex flex-col justify-between p-6 md:p-12 bg-cover bg-center border border-outline-variant bg-[#e8dccb] mb-12 shadow-sm">
          {/* Background overlay image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600&auto=format&fit=crop&q=80')`
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

          {/* Hero Header */}
          <div className="relative z-10 text-center pt-6 md:pt-10">
            <span className="inline-block px-4 py-1 bg-white/90 backdrop-blur-sm rounded-full font-label-caps text-label-caps text-on-surface uppercase tracking-widest mb-4 border border-outline-variant">
              VESIT Exclusive Marketplace
            </span>
            <h1 className="font-display-lg text-[38px] sm:text-[52px] md:text-display-lg text-white font-extrabold tracking-tight uppercase drop-shadow-md">
              THE SENSE OF AUCTION
            </h1>
            <p className="font-body-md text-white/90 max-w-xl mx-auto mt-2 text-sm sm:text-base">
              A curated, collegiate marketplace for buying, selling, and discovering verified student items.
            </p>
          </div>

          {/* Overlay White Card Pinned Bottom-Center */}
          <div className="relative z-10 w-full max-w-4xl mx-auto bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-6 md:p-8 border border-outline-variant shadow-lg mt-8">
            <div className="flex items-center gap-4 mb-3">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
                Built with intent
              </span>
              <div className="flex-grow h-[1px] bg-outline-variant"></div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl leading-relaxed">
                Transforming campus classifieds into a transparent, competitive, and refined auction house. Buy pre-owned textbooks, vintage electronics, and dorm furniture directly from fellow students.
              </p>
              {/* Thumbnails row */}
              <div className="flex items-center gap-2">
                {[
                  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100',
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100',
                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100',
                  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=100'
                ].map((thumb, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-lg overflow-hidden border border-outline-variant shrink-0 bg-surface"
                  >
                    <img src={thumb} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            2. SEARCH, SORT & CATEGORY FILTER BAR
            ========================================================= */}
        <div className="mb-10 space-y-6">
          {/* Search & Sort Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                search
              </span>
              <input
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search auctions by keyword, title, or description..."
                data-testid="search-input"
                className="w-full pl-11 pr-4 py-3 bg-surface-bright rounded-full border border-outline-variant font-body-md text-sm text-on-surface placeholder:text-secondary focus:border-on-surface focus:outline-none focus:ring-1 focus:ring-on-surface transition-colors"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => dispatchFilters({ type: 'SET_SEARCH', payload: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-black"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {/* Sort Selector */}
              <select
                value={filters.sort}
                onChange={handleSortSelect}
                data-testid="sort-select"
                aria-label="Sort auctions"
                className="px-3 py-2 bg-surface-bright rounded-full border border-outline-variant font-label-caps text-xs uppercase tracking-wider text-on-surface cursor-pointer focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Status Filter Toggle */}
              <div className="inline-flex rounded-full border border-outline-variant p-1 bg-surface-bright">
                {['all', 'live', 'ended'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusSelect(status)}
                    data-testid={`status-filter-${status}`}
                    className={`px-4 py-1.5 rounded-full font-label-caps text-[11px] uppercase tracking-wider transition-colors ${
                      filters.status === status
                        ? 'bg-black text-white'
                        : 'text-secondary hover:text-black'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'live' ? 'Live' : 'Ended'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Horizontal Bar */}
          <div className="flex items-center justify-start md:justify-center overflow-x-auto pb-2 border-b border-outline-variant gap-3 md:gap-6 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = filters.category === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategorySelect(cat.key)}
                  data-testid={`category-filter-${cat.key}`}
                  className={`font-label-caps text-label-caps uppercase tracking-wider whitespace-nowrap pb-3 transition-colors relative ${
                    isSelected
                      ? 'text-on-surface font-bold border-b-2 border-on-surface'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            3. AUCTION GRID (Three States: Loading, Error, Empty)
            ========================================================= */}
        {loadingListings ? (
          <div
            data-testid="listings-loading"
            className="py-20 flex flex-col items-center justify-center text-secondary gap-3"
          >
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            <span className="font-body-sm text-sm">Loading active auctions...</span>
          </div>
        ) : listingsError ? (
          <div
            data-testid="listings-error"
            className="py-16 text-center border border-error/30 rounded-2xl bg-error-container/10 my-8 p-6"
          >
            <span className="material-symbols-outlined text-[48px] text-error mb-2">error</span>
            <h3 className="font-headline-md text-xl text-on-surface font-bold">Failed to load auctions</h3>
            <p className="font-body-md text-secondary mt-1">{listingsError}</p>
            <button
              type="button"
              onClick={refetchListings}
              className="mt-4 px-6 py-2 bg-on-surface text-white rounded-full font-label-caps text-xs uppercase tracking-widest hover:opacity-80"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div
            data-testid="listings-empty"
            className="py-20 text-center border border-dashed border-outline-variant rounded-2xl bg-surface-bright my-8"
          >
            <span className="material-symbols-outlined text-[48px] text-secondary mb-3">search_off</span>
            <h3 className="font-headline-md text-[22px] text-on-surface font-bold">
              No matching auctions found
            </h3>
            <p className="font-body-md text-secondary mt-1">
              Try adjusting your search keyword or selecting a different category filter.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              data-testid="reset-filters-button"
              className="mt-4 px-6 py-2 bg-on-surface text-white rounded-full font-label-caps text-label-caps uppercase tracking-widest hover:opacity-80"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="font-label-caps text-xs uppercase tracking-wider text-secondary">
                Showing {listings.length} of {totalListings} auctions
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-10 mb-12">
              {listings.map((item) => (
                <AuctionCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div data-testid="pagination-controls" className="flex justify-center items-center gap-2 mb-16">
                <button
                  type="button"
                  data-testid="pagination-prev"
                  disabled={filters.page <= 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant font-label-caps text-xs uppercase disabled:opacity-30 hover:bg-surface-bright"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    data-testid={`pagination-page-${pg}`}
                    onClick={() => handlePageChange(pg)}
                    className={`w-8 h-8 rounded-lg font-label-caps text-xs flex items-center justify-center transition-colors ${
                      filters.page === pg
                        ? 'bg-black text-white font-bold'
                        : 'border border-outline-variant hover:bg-surface-bright text-secondary'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  type="button"
                  data-testid="pagination-next"
                  disabled={filters.page >= totalPages}
                  onClick={() => handlePageChange(filters.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant font-label-caps text-xs uppercase disabled:opacity-30 hover:bg-surface-bright"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            4. INFO BANNER (Editorial Double-Wing Banner)
            ========================================================= */}
        <div className="w-full bg-black text-white rounded-2xl overflow-hidden flex flex-col lg:flex-row border border-outline shadow-xl">
          {/* Left Half */}
          <div className="w-full lg:w-1/2 p-8 md:p-14 flex flex-col justify-between">
            <div>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-[#f3c348] mb-4 block">
                — ROOTED IN FORM &amp; FUNCTION
              </span>
              <h2 className="font-display-lg text-[36px] md:text-[48px] font-bold leading-tight uppercase tracking-tight mb-6">
                PERS—<br />PECTIVE
              </h2>
              <p className="font-body-md text-gray-300 text-sm md:text-base leading-relaxed max-w-md">
                Every semester, hundreds of quality textbooks, lab kits, and electronics change hands at VESIT. CampusBid provides the formal structure, transparent bidding logs, and seller verification needed to make peer transactions effortless.
              </p>
            </div>
            <div className="pt-8 mt-6 border-t border-gray-800 flex items-center gap-6">
              <div>
                <span className="font-label-caps text-[11px] text-gray-400 uppercase tracking-widest block">
                  Auction Days
                </span>
                <span className="font-body-md font-semibold text-white">Monday — Saturday</span>
              </div>
              <div className="w-[1px] h-8 bg-gray-800"></div>
              <div>
                <span className="font-label-caps text-[11px] text-gray-400 uppercase tracking-widest block">
                  Audience
                </span>
                <span className="font-body-md font-semibold text-white">VESIT Campus Only</span>
              </div>
            </div>
          </div>

          {/* Right Half */}
          <div className="w-full lg:w-1/2 relative bg-[#1c1c1c] p-8 md:p-14 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-800">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800')`
              }}
            ></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <span className="font-display-lg text-[64px] md:text-[80px] font-bold text-[#f3c348] leading-none block">
                  0%
                </span>
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-gray-300">
                  Zero Platform Fees for Students
                </span>
              </div>
              <span className="bg-white text-black px-4 py-1.5 rounded-full font-label-caps text-[11px] uppercase tracking-wider font-bold shadow-md">
                Campus Verified
              </span>
            </div>

            <div className="relative z-10 pt-12">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60" alt="Avatar" />
                    <img className="w-8 h-8 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60" alt="Avatar" />
                    <img className="w-8 h-8 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60" alt="Avatar" />
                  </div>
                  <span className="font-body-sm text-sm font-semibold text-white">
                    1,200+ Registered VESIT Bidders
                  </span>
                </div>
                <p className="font-body-sm text-xs text-gray-300">
                  Join fellow students in D12, D15, D17 and all branches actively listing items weekly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
