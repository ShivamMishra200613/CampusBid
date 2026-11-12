import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant w-full py-12 md:py-16 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 max-w-[1280px] mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start">
          <Link to="/" className="font-headline-md text-headline-md text-on-surface font-bold">
            CampusBid
          </Link>
          <p className="font-body-sm text-secondary mt-1">
            VESIT Collegiate Peer-to-Peer Online Auction System
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 font-label-caps text-label-caps text-on-surface-variant">
          <a
            href="#about"
            className="hover:text-on-surface transition-colors duration-200 uppercase tracking-wider"
          >
            Institutional Relations
          </a>
          <a
            href="#privacy"
            className="hover:text-on-surface transition-colors duration-200 uppercase tracking-wider"
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            className="hover:text-on-surface transition-colors duration-200 uppercase tracking-wider"
          >
            Terms of Service
          </a>
          <a
            href="#safety"
            className="hover:text-on-surface transition-colors duration-200 uppercase tracking-wider"
          >
            Campus Safety
          </a>
          <a
            href="#support"
            className="hover:text-on-surface transition-colors duration-200 uppercase tracking-wider"
          >
            Support
          </a>
        </div>

        <div className="font-body-sm text-body-sm text-on-surface-variant text-center md:text-right">
          © 2026 CampusBid Peer-to-Peer Auctions. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
