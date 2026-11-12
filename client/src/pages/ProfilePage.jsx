import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateRequired } from '../utils/validators';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    classBranch: 'D12C / EXTC',
    bio: '',
    outbidAlerts: true,
    auctionEndingAlerts: true,
    newMessageAlerts: false
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        classBranch: user.classBranch || 'D12C / EXTC',
        bio: user.bio || '',
        outbidAlerts: user.notificationPreferences?.outbidAlerts ?? true,
        auctionEndingAlerts: user.notificationPreferences?.auctionEndingAlerts ?? true,
        newMessageAlerts: user.notificationPreferences?.newMessageAlerts ?? false
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nameErr = validateRequired(formData.fullName, 'Full name');
    if (nameErr) {
      setErrors({ fullName: nameErr });
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        classBranch: formData.classBranch,
        bio: formData.bio,
        notificationPreferences: {
          outbidAlerts: formData.outbidAlerts,
          auctionEndingAlerts: formData.auctionEndingAlerts,
          newMessageAlerts: formData.newMessageAlerts
        }
      });
      showToast('Profile details updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="main-stage max-w-5xl">
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col md:flex-row border border-outline-variant shadow-sm">
          {/* =========================================================
              LEFT COLUMN: PROFILE SUMMARY & METRICS
              ========================================================= */}
          <div className="w-full md:w-1/3 p-8 border-b md:border-b-0 md:border-r border-outline-variant bg-surface flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full border border-outline-variant overflow-hidden mb-6 bg-surface-variant shadow-sm">
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
                }
                alt={user?.fullName || 'User Profile'}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="font-headline-md text-2xl font-bold mb-1 text-on-surface">
              {user?.fullName || 'Student Profile'}
            </h1>
            <p className="font-body-md text-sm text-secondary mb-1">
              {user?.classBranch || 'VESIT Student'}
            </p>
            {user?.rollNo && (
              <p className="font-body-sm text-xs text-secondary mb-4">Roll No. {user.rollNo}</p>
            )}

            <div className="bg-tertiary-container/30 text-tertiary border border-tertiary/40 px-3.5 py-1 rounded-full font-label-caps text-[11px] flex items-center gap-1 mb-6 font-bold">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {user?.role === 'admin' ? 'Administrator' : 'Verified VESIT Student'}
            </div>

            <p className="font-label-caps text-[11px] text-secondary uppercase tracking-widest mb-8">
              Account Status: {user?.isSuspended ? 'Suspended' : 'Active'}
            </p>

            {/* Metrics List */}
            <div className="w-full border-t border-outline-variant pt-6 space-y-3">
              <div className="flex justify-between items-center text-left py-1.5 border-b border-outline-variant">
                <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider">
                  Role
                </span>
                <span className="font-bold text-on-surface capitalize">
                  {user?.role || 'student'}
                </span>
              </div>

              <div className="flex justify-between items-center text-left py-1.5 border-b border-outline-variant">
                <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider">
                  Campus Verified
                </span>
                <span className="font-bold text-tertiary">Yes</span>
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: EDITABLE SETTINGS FORM
              ========================================================= */}
          <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col justify-between">
            <div>
              <h2 className="font-headline-md text-2xl font-bold mb-6 text-on-surface border-b border-outline-variant pb-4">
                Profile Settings
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="editorial-label" htmlFor="fullName">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      data-testid="profile-name-input"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`editorial-input ${errors.fullName ? 'border-error' : ''}`}
                    />
                    {errors.fullName && (
                      <p
                        data-testid="profile-name-error"
                        className="mt-1 text-xs text-red-500 font-body-sm"
                      >
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="editorial-label" htmlFor="email">
                      College Email (VESIT ID)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full rounded-full border border-outline-variant pl-4 pr-10 py-3 font-body-md text-sm text-secondary bg-surface-container cursor-not-allowed outline-none"
                      />
                      <span className="material-symbols-outlined absolute right-4 text-secondary text-[18px]">
                        lock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="editorial-label" htmlFor="phone">
                      Contact Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="editorial-input"
                    />
                  </div>

                  <div>
                    <label className="editorial-label" htmlFor="classBranch">
                      Class / Branch
                    </label>
                    <select
                      id="classBranch"
                      name="classBranch"
                      value={formData.classBranch}
                      onChange={handleChange}
                      className="editorial-input bg-surface-bright"
                    >
                      <option value="D12C / EXTC">D12C / EXTC</option>
                      <option value="D15A / CMPN">D15A / CMPN</option>
                      <option value="D17B / IT">D17B / IT</option>
                      <option value="D19 / AI&DS">D19 / AI&amp;DS</option>
                      <option value="D20 / INSTR">D20 / Instrumentation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="editorial-label" htmlFor="bio">
                    About / Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell other students about yourself, what you study, or items you frequently sell."
                    className="w-full appearance-none rounded-2xl border border-outline-variant bg-transparent p-4 font-body-md text-sm text-on-surface focus:border-on-surface focus:ring-1 focus:ring-on-surface outline-none resize-none transition-colors"
                  ></textarea>
                </div>

                {/* Notification Preferences */}
                <div className="pt-6 border-t border-outline-variant">
                  <h3 className="font-label-caps text-label-caps text-on-surface mb-4 uppercase tracking-wider font-bold">
                    Notification Preferences
                  </h3>
                  <div className="space-y-3">
                    <label className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-surface-bright">
                      <span className="font-body-md text-sm text-secondary">
                        Outbid notifications (Instant Web Alerts)
                      </span>
                      <input
                        type="checkbox"
                        name="outbidAlerts"
                        checked={formData.outbidAlerts}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-outline text-black focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-surface-bright">
                      <span className="font-body-md text-sm text-secondary">
                        Auction ending reminders
                      </span>
                      <input
                        type="checkbox"
                        name="auctionEndingAlerts"
                        checked={formData.auctionEndingAlerts}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-outline text-black focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-surface-bright">
                      <span className="font-body-md text-sm text-secondary">
                        New message &amp; inquiry alerts
                      </span>
                      <input
                        type="checkbox"
                        name="newMessageAlerts"
                        checked={formData.newMessageAlerts}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-outline text-black focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">
                          progress_activity
                        </span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Save Profile Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
