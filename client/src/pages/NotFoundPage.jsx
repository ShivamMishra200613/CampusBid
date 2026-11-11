import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="w-full flex-grow flex items-center justify-center p-6 py-20">
      <div className="max-w-lg w-full text-center bg-surface-container-lowest border border-outline-variant rounded-2xl p-10 shadow-sm">
        <span className="font-price-display text-8xl font-black text-secondary/30 block mb-2">
          404
        </span>
        <h1 className="font-headline-lg text-3xl font-bold text-on-surface mb-3">
          Page Not Found
        </h1>
        <p className="font-body-md text-secondary mb-8 leading-relaxed">
          The auction or page you are looking for doesn't exist, has ended, or was moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="btn-primary w-full sm:w-auto">
            Browse Auctions
          </Link>
          <Link to="/my-listings" className="btn-secondary w-full sm:w-auto">
            My Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
