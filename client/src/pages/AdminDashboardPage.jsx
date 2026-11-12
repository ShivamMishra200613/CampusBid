import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

  // Active section tabs: 'moderation' (listings + reports) or 'users' (user table)
  const [activeTab, setActiveTab] = useState('moderation');

  // Stats state
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalVolumeInr: 0,
    pendingApprovals: 0,
    flaggedListings: 0,
    liveAuctions: 0,
    completedAuctions: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Pending listings state
  const [pendingListings, setPendingListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, listingId: null, title: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reports state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [resolveModal, setResolveModal] = useState({ open: false, reportId: null, title: '' });
  const [resolutionAction, setResolutionAction] = useState('dismiss');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Users management state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await adminApi.getStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load admin stats.', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  // Fetch Pending Listings
  const fetchPendingListings = useCallback(async () => {
    try {
      setLoadingListings(true);
      const res = await adminApi.getPendingListings();
      if (res.success) {
        setPendingListings(res.listings || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load pending listings.', 'error');
    } finally {
      setLoadingListings(false);
    }
  }, [showToast]);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const res = await adminApi.getReports();
      if (res.success) {
        setReports(res.reports || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load reports.', 'error');
    } finally {
      setLoadingReports(false);
    }
  }, [showToast]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await adminApi.getUsers({ search: userSearch, page: userPage, limit: 10 });
      if (res.success) {
        setUsers(res.users || []);
        setUserTotalPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load campus users.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch, userPage, showToast]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchPendingListings();
    fetchReports();
  }, [fetchStats, fetchPendingListings, fetchReports]);

  // Trigger users fetch on tab switch or search
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Listing moderation actions
  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await adminApi.moderateListing(id, 'approve');
      showToast('Listing approved and published to live catalog!', 'success');
      fetchPendingListings();
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Failed to approve listing.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (listing) => {
    setRejectModal({ open: true, listingId: listing.id, title: listing.title });
    setRejectReason('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejecting the listing.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await adminApi.moderateListing(rejectModal.listingId, 'reject', rejectReason.trim());
      showToast('Listing rejected and seller notified.', 'info');
      setRejectModal({ open: false, listingId: null, title: '' });
      fetchPendingListings();
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Failed to reject listing.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Report resolution actions
  const handleOpenResolve = (rep) => {
    setResolveModal({
      open: true,
      reportId: rep.id,
      title: rep.product?.title || 'Reported Item'
    });
    setResolutionAction('dismiss');
    setResolutionNotes('');
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminApi.resolveReport(resolveModal.reportId, resolutionAction, resolutionNotes);
      showToast(`Report resolved (${resolutionAction.replace('_', ' ')}).`, 'success');
      setResolveModal({ open: false, reportId: null, title: '' });
      fetchReports();
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Failed to resolve report.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // User moderation actions
  const handleToggleSuspend = async (targetUser) => {
    const isCurrentlySuspended = targetUser.isSuspended;
    const action = isCurrentlySuspended ? 'reactivate' : 'suspend';
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${targetUser.fullName || targetUser.email}?`
      )
    ) {
      return;
    }

    try {
      if (isCurrentlySuspended) {
        await adminApi.unsuspendUser(targetUser.id);
        showToast(`User ${targetUser.fullName} reactivated.`, 'success');
      } else {
        await adminApi.suspendUser(targetUser.id);
        showToast(`User ${targetUser.fullName} suspended.`, 'info');
      }
      fetchUsers();
      fetchStats();
    } catch (err) {
      showToast(err.message || `Failed to ${action} user.`, 'error');
    }
  };

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
              Review pending collegiate listings, resolve campus reports, and moderate student
              accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('moderation')}
              data-testid="tab-moderation"
              className={`font-label-caps text-label-caps uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors ${
                activeTab === 'moderation'
                  ? 'bg-black text-white font-bold'
                  : 'bg-surface-bright text-secondary hover:text-black border border-outline-variant'
              }`}
            >
              Moderation Queue
            </button>
            <button
              onClick={() => setActiveTab('users')}
              data-testid="tab-users"
              className={`font-label-caps text-label-caps uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors ${
                activeTab === 'users'
                  ? 'bg-black text-white font-bold'
                  : 'bg-surface-bright text-secondary hover:text-black border border-outline-variant'
              }`}
            >
              Users &amp; Roles
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block mb-1">
                Active Students
              </span>
              <span className="font-price-display text-3xl font-bold text-on-surface">
                {loadingStats ? '...' : stats.activeUsers.toLocaleString('en-IN')}
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
                {loadingStats ? '...' : `₹${stats.totalVolumeInr.toLocaleString('en-IN')}`}
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
                {loadingStats ? '...' : stats.pendingApprovals}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block mb-1">
                Open Reports
              </span>
              <span className="font-price-display text-3xl font-bold text-on-surface">
                {loadingStats ? '...' : stats.flaggedListings}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[24px]">flag</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            TAB 1: MODERATION QUEUE (Pending Listings & Reports)
            ========================================================= */}
        {activeTab === 'moderation' && (
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
                {loadingListings ? (
                  <div className="py-16 text-center text-secondary">
                    <span className="material-symbols-outlined text-3xl animate-spin">
                      progress_activity
                    </span>
                    <p className="mt-2 text-xs">Loading queue...</p>
                  </div>
                ) : pendingListings.length === 0 ? (
                  <div className="py-16 text-center text-secondary font-body-sm">
                    <span className="material-symbols-outlined text-[36px] text-tertiary mb-1">
                      check_circle
                    </span>
                    <p className="font-semibold text-on-surface">All pending listings reviewed!</p>
                    <p className="text-xs text-secondary mt-1">
                      No items currently awaiting approval.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant font-label-caps text-[11px] text-secondary uppercase">
                          <th className="py-3 px-3">Item</th>
                          <th className="py-3 px-3">Seller</th>
                          <th className="py-3 px-3">Starting Bid</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-sm text-sm divide-y divide-outline-variant">
                        {pendingListings.map((item) => (
                          <tr
                            key={item.id}
                            data-testid="pending-listing-row"
                            className="hover:bg-surface-bright transition-colors"
                          >
                            <td className="py-3.5 px-3 flex items-center gap-3">
                              <div className="w-11 h-11 bg-surface-container rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                                <img
                                  src={
                                    item.images?.[0] ||
                                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'
                                  }
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="font-bold text-on-surface block text-sm line-clamp-1">
                                  {item.title}
                                </span>
                                <span className="font-label-caps text-[10px] text-secondary uppercase">
                                  {item.category} • {item.condition}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-secondary font-medium">
                              <div>
                                <p className="text-xs font-semibold text-on-surface">
                                  {item.seller?.fullName || 'Student'}
                                </p>
                                <p className="text-[11px] text-secondary">
                                  {item.seller?.email || ''}
                                </p>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 font-price-display font-bold text-on-surface">
                              ₹{(item.startingBid || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-right space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleOpenReject(item)}
                                data-testid="reject-listing-button"
                                className="bg-white text-error border border-error/50 px-3.5 py-1.5 rounded-full font-label-caps text-[10px] uppercase tracking-wider hover:bg-error-container/20 transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleApprove(item.id)}
                                data-testid="approve-listing-button"
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

            {/* Right Column (5 cols): Reports */}
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                <h2 className="font-headline-md text-xl font-bold text-on-surface">
                  Flagged Listings &amp; Reports
                </h2>
                <span className="px-2.5 py-1 bg-error-container text-error rounded-full font-label-caps text-[10px] uppercase font-bold">
                  {reports.length} Open
                </span>
              </div>

              <div className="p-6 flex flex-col gap-4 flex-grow">
                {loadingReports ? (
                  <div className="py-16 text-center text-secondary">
                    <span className="material-symbols-outlined text-3xl animate-spin">
                      progress_activity
                    </span>
                    <p className="mt-2 text-xs">Loading reports...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-16 text-center text-secondary font-body-sm">
                    <span className="material-symbols-outlined text-[36px] text-tertiary mb-1">
                      verified_user
                    </span>
                    <p className="font-semibold text-on-surface">No unresolved reports!</p>
                    <p className="text-xs text-secondary mt-1">
                      Campus marketplace integrity is healthy.
                    </p>
                  </div>
                ) : (
                  reports.map((rep) => {
                    const isOpen = rep.status === 'open';
                    return (
                      <div
                        key={rep.id}
                        data-testid="report-card"
                        className="border border-outline-variant rounded-xl p-4 flex flex-col gap-3 bg-surface-bright"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-label-caps text-[9px] uppercase tracking-wider mb-1.5 inline-block ${
                                isOpen
                                  ? 'bg-error-container text-error font-bold'
                                  : 'bg-surface-container-high text-on-surface-variant font-medium'
                              }`}
                            >
                              {isOpen ? 'Open Report' : `Resolved: ${rep.resolutionAction}`}
                            </span>
                            <h3 className="font-bold text-on-surface text-sm line-clamp-1">
                              {rep.product?.title || 'Reported Product'}
                            </h3>
                            <p className="font-body-sm text-xs text-secondary mt-0.5">
                              Reason: <span className="text-error font-semibold">{rep.reason}</span>
                            </p>
                          </div>

                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => handleOpenResolve(rep)}
                              data-testid="resolve-report-button"
                              className="bg-black text-white px-3.5 py-1.5 rounded-full font-label-caps text-[10px] uppercase tracking-wider hover:bg-gray-800 transition-colors shrink-0"
                            >
                              Resolve
                            </button>
                          )}
                        </div>

                        <div className="border-t border-outline-variant pt-2 flex justify-between items-center font-body-sm text-[11px] text-secondary">
                          <span>
                            By: {rep.reportedBy?.fullName || rep.reportedBy?.email || 'Student'}
                          </span>
                          <span>
                            {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: USERS TABLE (Search, Suspend, Unsuspend)
            ========================================================= */}
        {activeTab === 'users' && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm mb-12">
            <div className="p-6 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
              <div>
                <h2 className="font-headline-md text-xl font-bold text-on-surface">
                  VESIT Student &amp; Staff Directory
                </h2>
                <p className="font-body-sm text-xs text-secondary mt-0.5">
                  Manage active student access, roll numbers, and enforce immediate suspension.
                </p>
              </div>

              {/* Search box */}
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search name, email, roll no..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="editorial-input text-xs py-2"
                />
              </div>
            </div>

            <div className="p-4">
              {loadingUsers ? (
                <div className="py-20 text-center text-secondary">
                  <span className="material-symbols-outlined text-4xl animate-spin">
                    progress_activity
                  </span>
                  <p className="mt-2 text-sm">Loading users directory...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-20 text-center text-secondary">
                  <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                  <p className="font-semibold text-on-surface">No users match your search.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant font-label-caps text-[11px] text-secondary uppercase bg-surface-container-low">
                        <th className="py-3.5 px-4">Student</th>
                        <th className="py-3.5 px-4">Roll No / Branch</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Moderation Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-sm divide-y divide-outline-variant">
                      {users.map((u) => {
                        const isSelf = u.id === currentAdmin?.id;
                        const isAdminUser = u.role === 'admin';

                        return (
                          <tr
                            key={u.id}
                            data-testid="user-row"
                            className="hover:bg-surface-bright transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    u.avatarUrl ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                                  }
                                  alt={u.fullName}
                                  className="w-9 h-9 rounded-full object-cover border border-outline-variant"
                                />
                                <div>
                                  <p className="font-semibold text-on-surface">
                                    {u.fullName || 'Student'}
                                  </p>
                                  <p className="text-xs text-secondary">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-secondary text-xs">
                              <p className="font-medium text-on-surface">{u.rollNo || '—'}</p>
                              <p>{u.classBranch || '—'}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-label-caps text-[10px] uppercase font-bold ${
                                  isAdminUser
                                    ? 'bg-black text-white'
                                    : 'bg-surface-container text-secondary'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-label-caps text-[10px] uppercase font-bold ${
                                  u.isSuspended
                                    ? 'bg-error-container text-error'
                                    : 'bg-tertiary-container/40 text-tertiary'
                                }`}
                              >
                                {u.isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isSelf ? (
                                <span className="text-xs text-secondary italic">Current Admin</span>
                              ) : isAdminUser ? (
                                <span className="text-xs text-secondary italic">
                                  Admin Protected
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspend(u)}
                                  data-testid="suspend-user-button"
                                  className={`px-3.5 py-1.5 rounded-full font-label-caps text-[10px] uppercase tracking-wider transition-colors border ${
                                    u.isSuspended
                                      ? 'bg-tertiary text-white border-tertiary hover:opacity-90'
                                      : 'bg-white text-error border-error/50 hover:bg-error-container/20'
                                  }`}
                                >
                                  {u.isSuspended ? 'Reactivate' : 'Suspend User'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-outline-variant pt-4 px-2 mt-4">
                  <button
                    type="button"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <span className="font-label-caps text-xs text-secondary">
                    Page {userPage} of {userTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={userPage >= userTotalPages}
                    onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Listing Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-2xl animate-fade-in">
            <h3 className="font-headline-md text-xl font-bold mb-1 text-on-surface">
              Reject Listing
            </h3>
            <p className="font-body-sm text-secondary text-xs mb-4">
              Specify reason for rejecting "{rejectModal.title}". The seller will receive a
              notification.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="editorial-label" htmlFor="rejectReason">
                  Rejection Reason
                </label>
                <textarea
                  id="rejectReason"
                  required
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Prohibited laboratory apparatus or missing serial number."
                  className="editorial-input resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, listingId: null, title: '' })}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-error text-white px-5 py-2.5 rounded-full font-label-caps text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Report Modal */}
      {resolveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-2xl animate-fade-in">
            <h3 className="font-headline-md text-xl font-bold mb-1 text-on-surface">
              Resolve Dispute Report
            </h3>
            <p className="font-body-sm text-secondary text-xs mb-4">
              Select resolution action for "{resolveModal.title}".
            </p>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="editorial-label" htmlFor="resolutionAction">
                  Resolution Action
                </label>
                <select
                  id="resolutionAction"
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="editorial-input bg-surface-bright cursor-pointer"
                >
                  <option value="dismiss">Dismiss Report (No Violation)</option>
                  <option value="remove_listing">Remove Flagged Listing</option>
                  <option value="suspend_user">Suspend Offending Seller</option>
                </select>
              </div>

              <div>
                <label className="editorial-label" htmlFor="resolutionNotes">
                  Administrative Notes (Optional)
                </label>
                <textarea
                  id="resolutionNotes"
                  rows="2"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Notes explaining this resolution for internal audit."
                  className="editorial-input resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModal({ open: false, reportId: null, title: '' })}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn-primary">
                  Resolve Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
