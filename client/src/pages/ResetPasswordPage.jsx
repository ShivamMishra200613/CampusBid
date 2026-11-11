import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { validatePassword } from '../utils/validators';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passErr = validatePassword(newPassword);
    if (passErr) {
      setError(passErr);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.resetPassword({ token, newPassword });
      showToast(res.message || 'Password reset successfully! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center p-6 py-16">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
        <h1 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">
          Set New Password
        </h1>
        <p className="font-body-md text-sm text-secondary mb-6">
          Enter your new password below. It must be at least 8 characters with letters and numbers.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/30 text-error rounded-xl text-xs font-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="editorial-label" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="editorial-input"
            />
          </div>

          <div>
            <label className="editorial-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="editorial-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">
                  progress_activity
                </span>
                <span>Resetting Password...</span>
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="font-label-caps text-xs text-secondary hover:text-black uppercase tracking-wider"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
