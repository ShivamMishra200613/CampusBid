import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';
import NotificationModal from './NotificationModal';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout, toggleRole } = useAuth();
  const { notifications } = useAuction();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-surface w-full h-20 border-b border-outline-variant sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-8 w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-headline-md text-[26px] md:text-headline-md text-on-surface tracking-tight font-bold hover:opacity-90 transition-opacity"
            >
              CampusBid
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest rounded-full border border-outline-variant">
              VESIT Marketplace
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-8 h-full">
            <Link
              to="/"
              className={`font-label-caps text-label-caps uppercase tracking-widest transition-colors duration-200 flex items-center h-full border-b-2 ${
                isActive('/')
                  ? 'border-on-surface text-on-surface font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              Auctions
            </Link>
            <Link
              to="/my-listings"
              className={`font-label-caps text-label-caps uppercase tracking-widest transition-colors duration-200 flex items-center h-full border-b-2 ${
                isActive('/my-listings')
                  ? 'border-on-surface text-on-surface font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              My Listings
            </Link>
            <Link
              to="/my-bids"
              className={`font-label-caps text-label-caps uppercase tracking-widest transition-colors duration-200 flex items-center h-full border-b-2 ${
                isActive('/my-bids')
                  ? 'border-on-surface text-on-surface font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              My Bids
            </Link>
            <Link
              to="/admin"
              className={`font-label-caps text-label-caps uppercase tracking-widest transition-colors duration-200 flex items-center h-full border-b-2 ${
                isActive('/admin')
                  ? 'border-on-surface text-on-surface font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              Admin
              {isAdmin && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-black text-white text-[9px] rounded-full">
                  Admin
                </span>
              )}
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Quick Demo Switcher */}
            <button
              onClick={toggleRole}
              title="Toggle between Student and Admin roles for grading & testing"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-outline text-secondary hover:text-on-surface hover:border-black font-label-caps text-[10px] uppercase tracking-widest transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              Role: <strong className="text-black">{isAdmin ? 'Admin' : 'Student'}</strong>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-full hover:bg-surface-container text-on-surface transition-colors"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white font-label-caps text-[9px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* + Add Product */}
            <Link
              to="/create"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2 border border-on-surface text-on-surface rounded-full font-label-caps text-label-caps uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-colors duration-200"
            >
              + Add Product
            </Link>

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container transition-colors"
                  title="View Profile"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-outline-variant"
                  />
                  <span className="hidden md:inline-block font-body-md text-sm font-medium text-on-surface max-w-[100px] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Sign Out"
                  className="p-1.5 text-secondary hover:text-error rounded-full hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2 bg-on-surface text-white rounded-full font-label-caps text-label-caps uppercase tracking-widest hover:opacity-80 transition-opacity duration-200"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-surface-container text-on-surface"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-surface border-b border-outline-variant px-6 py-6 space-y-4 animate-fade-in">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-label-caps text-label-caps uppercase tracking-widest text-on-surface py-2"
            >
              Auctions Catalog
            </Link>
            <Link
              to="/my-listings"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-label-caps text-label-caps uppercase tracking-widest text-on-surface py-2"
            >
              My Listings
            </Link>
            <Link
              to="/my-bids"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-label-caps text-label-caps uppercase tracking-widest text-on-surface py-2"
            >
              My Bids
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-label-caps text-label-caps uppercase tracking-widest text-on-surface py-2"
            >
              Admin Dashboard
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-label-caps text-label-caps uppercase tracking-widest text-on-surface py-2"
            >
              Profile Settings
            </Link>
            <Link
              to="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center w-full py-3 bg-black text-white rounded-full font-label-caps text-label-caps uppercase tracking-widest"
            >
              + List New Item
            </Link>
            <div className="pt-2 border-t border-outline-variant flex justify-between items-center">
              <span className="font-body-sm text-secondary">Active Role: {isAdmin ? 'Admin' : 'Student'}</span>
              <button
                onClick={toggleRole}
                className="font-label-caps text-[11px] underline uppercase tracking-wider"
              >
                Switch
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Notifications Drawer/Modal */}
      <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}
