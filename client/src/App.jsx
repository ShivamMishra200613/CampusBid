import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AuctionProvider } from './context/AuctionContext';
import { SocketProvider } from './context/SocketContext';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
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
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AuctionProvider>
            <SocketProvider>
              <Router>
                <div className="min-h-screen flex flex-col bg-primary-container text-on-surface antialiased selection:bg-primary selection:text-white">
                  <Navbar />
                  <main className="flex-grow flex flex-col">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/auctions/:id" element={<AuctionDetailPage />} />
                      <Route
                        path="/create"
                        element={
                          <ProtectedRoute>
                            <CreateListingPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-listings"
                        element={
                          <ProtectedRoute>
                            <MyListingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-bids"
                        element={
                          <ProtectedRoute>
                            <MyBidsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminDashboardPage />
                          </AdminRoute>
                        }
                      />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Footer />
                  <Toast />
                </div>
              </Router>
            </SocketProvider>
          </AuctionProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
