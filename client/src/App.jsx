import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuctionProvider } from './context/AuctionContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';

import HomePage from './pages/HomePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import MyListingsPage from './pages/MyListingsPage';
import MyBidsPage from './pages/MyBidsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <AuctionProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-primary-container text-on-surface antialiased selection:bg-primary selection:text-white">
            <Navbar />
            <main className="flex-grow flex flex-col">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auctions/:id" element={<AuctionDetailPage />} />
                <Route path="/create" element={<CreateListingPage />} />
                <Route path="/my-listings" element={<MyListingsPage />} />
                <Route path="/my-bids" element={<MyBidsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Fallback */}
                <Route path="*" element={<HomePage />} />
              </Routes>
            </main>
            <Footer />
            <Toast />
          </div>
        </Router>
      </AuctionProvider>
    </AuthProvider>
  );
}
