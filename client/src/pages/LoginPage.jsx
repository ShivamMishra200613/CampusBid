import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/client';
import { validateEmail, validateRequired } from '../utils/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState({});

  // Forgot Password modal state
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const validateForm = () => {
    const errs = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const passErr = validateRequired(password, 'Password');
    if (passErr) errs.password = passErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setServerError('');
      const loggedUser = await login(email, password);
      showToast(`Logged in successfully! Welcome, ${loggedUser.fullName || 'Student'}.`, 'success');

      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        const destination = location.state?.from?.pathname || '/';
        navigate(destination);
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(forgotEmail);
    if (emailErr) {
      setForgotErr(emailErr);
      return;
    }

    try {
      setForgotLoading(true);
      setForgotErr('');
      const res = await authApi.forgotPassword(forgotEmail);
      setForgotMsg(res.message || 'Reset instructions generated. Check server console for link.');
      showToast('Password reset requested! Check server logs in dev mode.', 'info');
    } catch (err) {
      setForgotErr(err.message || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 md:p-8">
      <div className="bg-surface-container-lowest w-full max-w-[1280px] rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px] border border-outline-variant shadow-xl">
        {/* =========================================================
            LEFT COLUMN: LOGIN FORM
            ========================================================= */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
          <div className="max-w-md mx-auto w-full">
            {/* Brand Logo */}
            <div className="mb-8">
              <Link to="/" className="font-headline-md text-2xl font-bold text-on-surface">
                CampusBid
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="font-headline-lg text-[32px] md:text-headline-lg font-bold text-on-surface mb-2">
                Welcome back
              </h1>
              <p className="font-body-md text-secondary">
                Log in with your VESIT student email to start bidding and listing.
              </p>
            </div>

            {serverError && (
              <div
                data-testid="login-server-error"
                className="mb-6 p-4 rounded-xl bg-error-container/40 border border-error/30 text-error font-body-sm text-sm"
              >
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="editorial-label" htmlFor="email">
                  College Email
                </label>
                <input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  required
                  placeholder="name.surname@ves.ac.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    if (serverError) setServerError('');
                  }}
                  className={`editorial-input ${errors.email ? 'border-error' : ''}`}
                />
                {errors.email && (
                  <p data-testid="login-email-error" className="mt-1 text-xs text-error font-body-sm text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMsg('');
                      setForgotErr('');
                      setForgotEmail('');
                      setForgotModal(true);
                    }}
                    className="font-label-caps text-[11px] text-secondary hover:text-black uppercase tracking-wider transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    data-testid="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      if (serverError) setServerError('');
                    }}
                    className={`editorial-input pr-12 ${errors.password ? 'border-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p data-testid="login-password-error" className="mt-1 text-xs text-error font-body-sm text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit-button"
                className="w-full rounded-full bg-on-surface text-white font-label-caps text-label-caps uppercase tracking-widest py-4 mt-6 hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Log In →'
                )}
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-8 text-center">
              <p className="font-body-sm text-secondary">
                New here?{' '}
                <Link to="/register" className="text-on-surface font-semibold underline hover:text-primary transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: IMAGE COLLAGE (Desktop)
            ========================================================= */}
        <div className="hidden md:block w-1/2 relative bg-surface-container overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1000&auto=format&fit=crop&q=80"
            alt="Collegiate Auction Catalog"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/25"></div>
          <div className="absolute bottom-8 left-8 right-8 p-6 bg-surface-container-lowest/90 backdrop-blur-md rounded-xl border border-outline-variant">
            <span className="font-label-caps text-[10px] text-primary uppercase tracking-widest block mb-1">
              Curated Peer Exchange
            </span>
            <p className="font-body-md text-sm text-on-surface font-medium">
              "CampusBid made it so simple to sell my third-year electronics kits and buy textbooks without WhatsApp chaos."
            </p>
            <span className="font-body-sm text-xs text-secondary mt-2 block">
              — D15A Student Review
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-2xl animate-fade-in">
            <h3 className="font-headline-md text-xl font-bold mb-2 text-on-surface">
              Reset Password
            </h3>
            <p className="font-body-sm text-secondary mb-4">
              Enter your VES college email address. A password reset link will be generated.
            </p>

            {forgotMsg && (
              <div className="mb-4 p-3 bg-tertiary-container/40 border border-tertiary/30 text-tertiary rounded-xl text-xs font-body-sm">
                {forgotMsg}
              </div>
            )}

            {forgotErr && (
              <div className="mb-4 p-3 bg-error-container/40 border border-error/30 text-error rounded-xl text-xs font-body-sm">
                {forgotErr}
              </div>
            )}

            <form onSubmit={handleForgot} className="space-y-4">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setForgotErr('');
                }}
                placeholder="name.surname@ves.ac.in"
                className="editorial-input"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary flex items-center gap-1.5"
                >
                  {forgotLoading ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : null}
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
