import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { Link } from 'react-router-dom';

export default function NotificationModal({ isOpen, onClose }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAuction();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant overflow-hidden animate-fade-in mt-14"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">notifications</span>
            <h3 className="font-headline-md text-[18px] text-on-surface font-bold">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-[12px] font-label-caps uppercase tracking-wider text-secondary hover:text-on-surface transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-outline-variant">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-secondary font-body-sm">
              No notifications at the moment.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-4 transition-colors hover:bg-surface-container-low cursor-pointer ${
                  !notif.read ? 'bg-primary-fixed/20' : 'bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === 'outbid'
                        ? 'bg-error-container text-error'
                        : notif.type === 'auction_won'
                        ? 'bg-tertiary-container text-tertiary'
                        : 'bg-primary-fixed text-on-primary-fixed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {notif.type === 'outbid'
                        ? 'gavel'
                        : notif.type === 'auction_won'
                        ? 'emoji_events'
                        : 'notifications'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-label-caps text-[12px] font-bold text-on-surface">
                        {notif.title}
                      </p>
                      <span className="text-[11px] text-secondary font-body-sm">{notif.createdAt}</span>
                    </div>
                    <p className="font-body-sm text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.productId && (
                      <Link
                        to={`/auctions/${notif.productId}`}
                        onClick={onClose}
                        className="inline-block mt-2 font-label-caps text-[11px] text-primary underline uppercase tracking-wider hover:text-black"
                      >
                        View Auction →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
