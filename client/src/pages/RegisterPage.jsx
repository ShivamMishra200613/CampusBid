import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useAuction();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    classBranch: '',
    rollNo: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email.endsWith('@ves.ac.in')) {
      showToast('Only @ves.ac.in emails are eligible for registration.', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (formData.password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    register(formData);
    showToast('Registration successful! Welcome to CampusBid.', 'success');
    navigate('/');
  };

  return (
    <div className="w-full flex items-center justify-center p-4 md:p-8">
      <div className="bg-surface-container-lowest w-full max-w-[1280px] rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[720px] border border-outline-variant shadow-xl">
        {/* =========================================================
            LEFT COLUMN: REGISTRATION FORM
            ========================================================= */}
        <div className="w-full md:w-1/2 p-8 md:p-14 lg:p-16 flex flex-col justify-center bg-surface-container-lowest border-r border-outline-variant">
          <div className="max-w-md w-full mx-auto">
            {/* Branding & Back link */}
            <div className="mb-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 mb-4 text-secondary hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider">
                  Back to Login
                </span>
              </Link>

              <h1 className="font-headline-lg text-[32px] md:text-headline-lg font-bold text-on-surface mb-2">
                Join CampusBid
              </h1>
              <p className="font-body-md text-secondary">
                Create your student account to start bidding and listing.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="editorial-label" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Shivam Mishra"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="editorial-input"
                />
              </div>

              <div>
                <label className="editorial-label" htmlFor="email">
                  VESIT College Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name.surname@ves.ac.in"
                  value={formData.email}
                  onChange={handleChange}
                  className="editorial-input"
                />
                <p className="mt-1 text-xs text-secondary font-body-sm">
                  Only <strong>@ves.ac.in</strong> email domains are permitted.
                </p>
              </div>

              {/* Class/Branch and Roll No Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="editorial-label" htmlFor="classBranch">
                    Class / Branch
                  </label>
                  <input
                    id="classBranch"
                    name="classBranch"
                    type="text"
                    required
                    placeholder="e.g. D15A / CMPN"
                    value={formData.classBranch}
                    onChange={handleChange}
                    className="editorial-input"
                  />
                </div>

                <div>
                  <label className="editorial-label" htmlFor="rollNo">
                    Roll No.
                  </label>
                  <input
                    id="rollNo"
                    name="rollNo"
                    type="text"
                    required
                    placeholder="e.g. 28"
                    value={formData.rollNo}
                    onChange={handleChange}
                    className="editorial-input"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="editorial-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="editorial-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-secondary hover:text-black"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <label className="editorial-label" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="editorial-input pr-10"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start pt-2">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                  className="w-4 h-4 mt-0.5 rounded border-outline text-black focus:ring-0 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="ml-2.5 font-body-sm text-xs text-secondary leading-normal">
                  I agree to the VESIT Marketplace Community Guidelines and Terms of Service.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full rounded-full bg-on-surface text-white font-label-caps text-label-caps uppercase tracking-widest py-4 mt-4 hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                Create Account →
              </button>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-outline-variant">
              <p className="font-body-sm text-xs text-secondary">
                Already registered?{' '}
                <Link to="/login" className="text-on-surface font-semibold underline hover:text-primary transition-colors">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: CURATED COLLECTIONS BENTO GRID
            ========================================================= */}
        <div className="hidden md:flex w-1/2 bg-surface-container p-8 lg:p-12 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-headline-md text-2xl font-bold text-on-surface">
              Curated Collegiate Collections
            </h2>
            <p className="font-body-sm text-secondary mt-1">
              Discover verified academic textbooks, instruments, and hardware.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6 relative z-10">
            <div className="relative rounded-xl overflow-hidden aspect-[4/5] border border-outline-variant group">
              <img
                src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"
                alt="Mathematics"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="font-label-caps text-[9px] bg-white/90 text-black px-2 py-0.5 rounded uppercase font-bold w-fit mb-1">
                  Textbooks
                </span>
                <span className="font-body-md text-xs font-semibold text-white">
                  Calculus &amp; Algebra
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-outline-variant group">
                <img
                  src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600"
                  alt="Typewriter"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                  <span className="font-body-md text-xs font-semibold text-white">
                    Vintage Equipment
                  </span>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-outline-variant group">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"
                  alt="Headphones"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                  <span className="font-body-md text-xs font-semibold text-white">
                    Study Gadgets
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant relative z-10">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-primary block mb-1">
              Safety Guarantee
            </span>
            <p className="font-body-sm text-xs text-secondary">
              All buyers and sellers must authenticate with their official VESIT college credentials to prevent fraud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
