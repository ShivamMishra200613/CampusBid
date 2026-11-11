import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { validateTitle, validatePrice, validateRequired } from '../utils/validators';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { createListing, showToast } = useAuction();
  const { isAuthenticated } = useAuth();

  const [images, setImages] = useState([
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    category: 'electronics',
    condition: 'Like New',
    description: '',
    startingBid: '',
    minIncrement: '50',
    duration: '3d'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
      setShowAddUrlInput(false);
    }
  };

  const validateForm = () => {
    const errs = {};
    const titleErr = validateTitle(formData.title);
    if (titleErr) errs.title = titleErr;

    const descErr = validateRequired(formData.description, 'Description');
    if (descErr) {
      errs.description = descErr;
    } else if (formData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }

    const priceErr = validatePrice(formData.startingBid, 'Starting bid');
    if (priceErr) errs.startingBid = priceErr;

    const incErr = validatePrice(formData.minIncrement, 'Minimum increment');
    if (incErr) errs.minIncrement = incErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (isDraft = false) => {
    if (!isAuthenticated) {
      showToast('Please log in to list an auction.', 'error');
      navigate('/login');
      return;
    }
    if (!validateForm()) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }
    if (images.length === 0) {
      showToast('Please add at least one product photo.', 'error');
      return;
    }

    const payload = {
      ...formData,
      images,
      isDraft
    };

    createListing(payload);
    if (isDraft) {
      navigate('/my-listings');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-full">
      <div className="main-stage max-w-4xl">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-label-caps text-label-caps text-secondary hover:text-on-surface uppercase tracking-wider transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Catalog
          </Link>
        </div>

        {/* Form Header */}
        <div className="mb-10 pb-6 border-b border-outline-variant">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold leading-tight">
            List a New Item
          </h1>
          <p className="font-body-md text-secondary mt-1">
            Create an auction listing for verified VESIT students.
          </p>
        </div>

        <div className="space-y-12">
          {/* =========================================================
              1. UPLOAD MEDIA
              ========================================================= */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
              <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-secondary font-bold">
                1. Upload Media
              </h2>
              <span className="font-body-sm text-xs text-secondary">
                {images.length} of 5 photos added
              </span>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-outline-variant relative group shrink-0 bg-surface-container"
                >
                  <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-white/90 text-black text-[9px] font-label-caps px-1.5 py-0.5 rounded uppercase font-bold">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {/* Add slot */}
              {images.length < 5 && (
                <div
                  onClick={() => setShowAddUrlInput(true)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-secondary cursor-pointer hover:bg-surface-container-low hover:border-black transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                  <span className="font-label-caps text-[10px] uppercase mt-1">Add Photo</span>
                </div>
              )}
            </div>

            {/* Quick URL input modal/box */}
            {showAddUrlInput && (
              <div className="mt-4 p-4 rounded-xl bg-surface-bright border border-outline-variant flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="url"
                  placeholder="Paste image URL (e.g. https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="editorial-input flex-1"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="btn-primary flex-1 sm:flex-none px-6 py-2.5"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUrlInput(false)}
                    className="btn-secondary flex-1 sm:flex-none px-4 py-2.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* =========================================================
              2. ITEM DETAILS
              ========================================================= */}
          <section>
            <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-secondary font-bold mb-6 border-b border-outline-variant pb-2">
              2. Item Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="editorial-label" htmlFor="title">
                  Item Title
                </label>
                <input
                  id="title"
                  name="title"
                  data-testid="listing-title-input"
                  type="text"
                  required
                  placeholder="e.g. Vintage Smith-Corona Typewriter / Stewart Calculus 8th Ed"
                  value={formData.title}
                  onChange={handleChange}
                  className={`editorial-input ${errors.title ? 'border-error' : ''}`}
                />
                {errors.title && (
                  <p data-testid="listing-title-error" className="mt-1 text-xs text-red-500 font-body-sm">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="editorial-label" htmlFor="category">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="editorial-input bg-surface-bright cursor-pointer"
                  >
                    <option value="electronics">Electronics &amp; Gadgets</option>
                    <option value="books">Textbooks &amp; Study Material</option>
                    <option value="furniture">Dorm Furniture &amp; Lamps</option>
                    <option value="fashion">College Apparel &amp; Fashion</option>
                    <option value="sports">Sports &amp; Fitness</option>
                    <option value="others">Other Academic Artifacts</option>
                  </select>
                </div>

                <div>
                  <label className="editorial-label" htmlFor="condition">
                    Condition
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="editorial-input bg-surface-bright cursor-pointer"
                  >
                    <option value="Brand New">Brand New (Unopened)</option>
                    <option value="Like New">Like New (Mint Condition)</option>
                    <option value="Good">Good (Minor Wear)</option>
                    <option value="Fair">Fair (Fully Functional)</option>
                    <option value="Vintage">Vintage / Collectible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="editorial-label" htmlFor="description">
                  Item Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  data-testid="listing-description-input"
                  rows="5"
                  required
                  placeholder="Provide a detailed description of the item, highlighting condition, usage duration, and bundled accessories..."
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full appearance-none rounded-2xl border ${errors.description ? 'border-red-500' : 'border-outline-variant'} bg-transparent p-4 font-body-md text-on-surface focus:border-on-surface focus:ring-1 focus:ring-on-surface outline-none resize-none transition-colors`}
                ></textarea>
                {errors.description && (
                  <p data-testid="listing-description-error" className="mt-1 text-xs text-red-500 font-body-sm">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* =========================================================
              3. AUCTION SETTINGS
              ========================================================= */}
          <section>
            <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-secondary font-bold mb-6 border-b border-outline-variant pb-2">
              3. Auction Parameters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="editorial-label" htmlFor="startingBid">
                  Starting Bid Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-secondary">
                    ₹
                  </span>
                  <input
                    id="startingBid"
                    name="startingBid"
                    data-testid="listing-starting-bid-input"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={formData.startingBid}
                    onChange={handleChange}
                    className={`editorial-input pl-8 ${errors.startingBid ? 'border-error' : ''}`}
                  />
                </div>
                {errors.startingBid && (
                  <p data-testid="listing-starting-bid-error" className="mt-1 text-xs text-red-500 font-body-sm">
                    {errors.startingBid}
                  </p>
                )}
              </div>

              <div>
                <label className="editorial-label" htmlFor="minIncrement">
                  Min. Bid Increment (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-secondary">
                    ₹
                  </span>
                  <input
                    id="minIncrement"
                    name="minIncrement"
                    data-testid="listing-increment-input"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={formData.minIncrement}
                    onChange={handleChange}
                    className={`editorial-input pl-8 ${errors.minIncrement ? 'border-error' : ''}`}
                  />
                </div>
                {errors.minIncrement && (
                  <p data-testid="listing-increment-error" className="mt-1 text-xs text-red-500 font-body-sm">
                    {errors.minIncrement}
                  </p>
                )}
              </div>

              <div>
                <label className="editorial-label" htmlFor="duration">
                  Auction Duration
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="editorial-input bg-surface-bright cursor-pointer"
                >
                  <option value="24h">24 Hours (Flash Auction)</option>
                  <option value="3d">3 Days (Recommended)</option>
                  <option value="7d">7 Days (Standard Week)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="pt-8 border-t border-outline-variant flex flex-col sm:flex-row justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="btn-secondary w-full sm:w-auto"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="btn-primary w-full sm:w-auto"
            >
              Publish Auction Listing →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
