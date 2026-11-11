import React from 'react';
import { useAuction } from '../context/AuctionContext';

export default function Toast() {
  const { toast } = useAuction();

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-full shadow-lg border text-body-sm font-medium ${
          isError
            ? 'bg-error text-white border-error-container'
            : isInfo
            ? 'bg-surface-container-highest text-on-surface border-outline-variant'
            : 'bg-black text-white border-outline-variant'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isError ? 'error' : isInfo ? 'info' : 'check_circle'}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
