import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const {
    auctions,
    pendingListings,
    reports,
    approveListing,
    rejectListing,
    resolveReport
  } = useAuction();
  const { isAdmin, toggleRole } = useAuth();

  const totalVolume = auctions.reduce((acc, curr) => acc + (curr.currentBid || 0), 450000);

  return (
    <div className="w-full">
      <div className="main-stage">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-headline-lg text-[28px] md:text-headline-lg font-bold text-on-surface">
                Administrator Dashboard
              </h1>
              <span className="px-3 py-1 bg-black text-white font-label-caps text-[10px] uppercase tracking-widest rounded-full">
                Moderation Cell
              </span>
            </div>
            <p className="font-body-md text-secondary">
              Review pending collegiate listings, monitor live bid logs, and resolve reported disputes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleRole}
              className="px-4 py-2 border border-outline-variant bg-surface-bright hover:bg-surface-container rounded-full font-label-caps text-[11px] uppercase tracking-wider transition-colors"
            >
              Active Role: <strong className="text-black">{isAdmin ? 'Admin' : 'Student'}</strong> (Toggle)
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block mb-1">
                Active Bidders
              </span>
              <span className="font-price-display text-3xl font-bold text-on-surface">
                1,240
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block mb-1">
                Total Traded Volume
              </span>
              <span className="font-price-display text-3xl font-bold text-on-surface">
                ₹{totalVolume.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-[#4CAF50]">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block mb-1">
                Pending Approvals
              </span>
              <span className="font-price-display text-3xl font-bold text-on-surface">
                {pendingListings.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block mb-1">
                Flagged Listings
              </span>
              <span className="font-price-display text-3xl font-bold text-on-surface">
                {reports.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[24px]">flag</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Pending Listings (Left) + Reports (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left Column (7 cols): Pending Listings */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <div>
                <h2 className="font-headline-md text-xl font-bold text-on-surface">
                  Pending Listings Awaiting Review
                </h2>
                <p className="font-body-sm text-xs text-secondary mt-0.5">
                  Verify campus legitimacy and safety guidelines before approving.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-surface-container rounded-full font-label-caps text-[10px] uppercase font-bold">
                {pendingListings.length} In Queue
              </span>
            </div>

            <div className="p-4 flex-grow">
              {pendingListings.length === 0 ? (
                <div className="py-16 text-center text-secondary font-body-sm">
                  <span className="material-symbols-outlined text-[36px] text-tertiary mb-1">
                    check_circle
                  </span>
                  <p className="font-semibold text-on-surface">All pending listings reviewed!</p>
                  <p className="text-xs text-secondary mt-1">No items currently awaiting approval.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant font-label-caps text-[11px] text-secondary uppercase">
                        <th className="py-3 px-3">Item</th>
                        <th className="py-3 px-3">Seller</th>
                        <th className="py-3 px-3">Submitted</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-sm divide-y divide-outline-variant">
                      {pendingListings.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-bright transition-colors">
                          <td className="py-3.5 px-3 flex items-center gap-3">
                            <div className="w-11 h-11 bg-surface-container rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-on-surface block text-sm line-clamp-1">
                                {item.title}
                              </span>
                              <span className="font-label-caps text-[10px] text-secondary uppercase">
                                {item.category} • ₹{item.startingBid?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-secondary font-medium">
                            {item.seller}
                          </td>
                          <td className="py-3.5 px-3 text-secondary text-xs">
                            {item.submittedAt}
                          </td>
                          <td className="py-3.5 px-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => rejectListing(item.id)}
                              className="bg-white text-black border border-black px-3.5 py-1.5 rounded-full font-label-caps text-[10px] uppercase tracking-wider hover:bg-surface-container transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => approveListing(item.id)}
                              className="bg-black text-white px-3.5 py-1.5 rounded-full font-label-caps text-[10px] uppercase tracking-wider hover:bg-gray-800 transition-colors"
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Recent Reports */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <h2 className="font-headline-md text-xl font-bold text-on-surface">
                Reported Listings &amp; Disputes
              </h2>
              <span className="px-2.5 py-1 bg-error-container text-error rounded-full font-label-caps text-[10px] uppercase font-bold">
                {reports.length} Active
              </span>
            </div>

            <div className="p-6 flex flex-col gap-4 flex-grow">
              {reports.length === 0 ? (
                <div className="py-16 text-center text-secondary font-body-sm">
                  <span className="material-symbols-outlined text-[36px] text-tertiary mb-1">
                    verified_user
                  </span>
                  <p className="font-semibold text-on-surface">No unresolved reports!</p>
                  <p className="text-xs text-secondary mt-1">Campus marketplace integrity is healthy.</p>
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="border border-outline-variant rounded-xl p-4 flex flex-col gap-3 bg-surface-bright"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-label-caps text-[9px] uppercase tracking-wider mb-1.5 inline-block ${
                            rep.status === 'Action Required'
                              ? 'bg-error-container text-error font-bold'
                              : 'bg-surface-container-high text-on-surface-variant font-medium'
                          }`}
                        >
                          {rep.status}
                        </span>
                        <h3 className="font-bold text-on-surface text-sm">
                          {rep.productTitle}
                        </h3>
                        <p className="font-body-sm text-xs text-secondary mt-0.5">
                          Reason: <span className="text-error font-semibold">{rep.reason}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => resolveReport(rep.id)}
                        className="bg-black text-white px-3.5 py-1.5 rounded-full font-label-caps text-[10px] uppercase tracking-wider hover:bg-gray-800 transition-colors shrink-0"
                      >
                        Resolve
                      </button>
                    </div>

                    <div className="border-t border-outline-variant pt-2 flex justify-between items-center font-body-sm text-[11px] text-secondary">
                      <span>Reported by: {rep.reportedBy}</span>
                      <span>{rep.reportedAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
