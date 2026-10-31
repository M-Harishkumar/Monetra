import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Clock,
  Server,
  ShieldAlert,
  Check,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  X,
  CreditCard,
  Info,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { AppNotification, NotificationCategory } from '../../types.ts';

export const NotificationCenter: React.FC = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`nexora_read_notifs_${user?.id || 'anon'}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync read states to localStorage
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(
          `nexora_read_notifs_${user.id}`,
          JSON.stringify(Array.from(readIds))
        );
      } catch (err) {
        console.error('Failed to save read notifications', err);
      }
    }
  }, [readIds, user?.id]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.getNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn('Failed to fetch real-time notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [role, user?.id]);

  // Close panel on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
  const criticalUnreadCount = notifications.filter(
    (n) => !readIds.has(n.id) && n.severity === 'critical'
  ).length;

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(new Set(allIds));
  };

  const handleActionClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  // Filter list by selected category
  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'system') return n.category === 'system' || n.category === 'security';
    return n.category === activeCategory;
  });

  const getCategoryIcon = (category: string, severity: string) => {
    if (category === 'payment') {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#D9535D] border border-rose-100">
          <CreditCard className="h-4 w-4" />
        </div>
      );
    }
    if (category === 'renewal') {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#E5A33B] border border-amber-100">
          <Clock className="h-4 w-4" />
        </div>
      );
    }
    if (category === 'security') {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
          <ShieldAlert className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#368CE7] border border-[#DCEEFF]">
        <Server className="h-4 w-4" />
      </div>
    );
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getFeedTitle = () => {
    switch (role) {
      case 'ADMIN':
        return 'Admin Executive Feed';
      case 'STAFF':
        return 'Staff Operations Feed';
      case 'CUSTOMER':
        return 'Account Activity Feed';
      default:
        return 'Alerts & Notifications';
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notification Center"
        aria-expanded={isOpen}
        title="Notifications & Role-Based Alerts"
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all cursor-pointer ${
          isOpen
            ? 'border-[#368CE7] bg-[#EAF4FF] text-[#368CE7] shadow-sm'
            : 'border-[#D9E8F5] bg-[#F4F9FF] text-[#243B53] hover:border-[#368CE7] hover:bg-[#EAF4FF] hover:text-[#368CE7]'
        }`}
      >
        <Bell className="h-4 w-4" />

        {/* Unread badge count */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs ${
              criticalUnreadCount > 0 ? 'bg-[#D9535D] animate-pulse' : 'bg-[#368CE7]'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[340px] sm:w-[420px] rounded-2xl border border-[#D9E8F5] bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="border-b border-[#D9E8F5] bg-[#F4F9FF]/80 p-3.5 sm:p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#368CE7] text-white shadow-xs">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#243B53] font-heading flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#EAF4FF] px-2 py-0.5 text-[10px] font-extrabold text-[#368CE7] border border-[#DCEEFF]">
                        {unreadCount} New
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#647A91] font-medium">{getFeedTitle()}</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={fetchNotifications}
                  disabled={isLoading}
                  title="Refresh notifications"
                  className="rounded-lg p-1.5 text-[#647A91] hover:bg-white hover:text-[#368CE7] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="flex items-center gap-1 rounded-lg border border-[#D9E8F5] bg-white px-2 py-1 text-[11px] font-semibold text-[#368CE7] hover:bg-[#EAF4FF] hover:border-[#368CE7] transition-colors cursor-pointer"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-[#647A91] hover:bg-white hover:text-[#243B53] transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#368CE7] text-white shadow-xs'
                    : 'bg-white text-[#647A91] border border-[#D9E8F5] hover:text-[#243B53]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveCategory('payment')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === 'payment'
                    ? 'bg-[#368CE7] text-white shadow-xs'
                    : 'bg-white text-[#647A91] border border-[#D9E8F5] hover:text-[#243B53]'
                }`}
              >
                Payments (
                {notifications.filter((n) => n.category === 'payment').length})
              </button>
              <button
                onClick={() => setActiveCategory('renewal')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === 'renewal'
                    ? 'bg-[#368CE7] text-white shadow-xs'
                    : 'bg-white text-[#647A91] border border-[#D9E8F5] hover:text-[#243B53]'
                }`}
              >
                Renewals (
                {notifications.filter((n) => n.category === 'renewal').length})
              </button>
              <button
                onClick={() => setActiveCategory('system')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === 'system'
                    ? 'bg-[#368CE7] text-white shadow-xs'
                    : 'bg-white text-[#647A91] border border-[#D9E8F5] hover:text-[#243B53]'
                }`}
              >
                System & Alerts (
                {
                  notifications.filter(
                    (n) => n.category === 'system' || n.category === 'security'
                  ).length
                }
                )
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#D9E8F5] p-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#368CE7]">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-[#243B53]">All Caught Up</h4>
                <p className="mt-1 text-[11px] text-[#647A91] max-w-[240px] mx-auto">
                  No active notifications in this category. You will be alerted when new events occur.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleActionClick(notif)}
                    className={`group relative flex items-start gap-3 p-3 transition-colors cursor-pointer rounded-xl ${
                      isRead
                        ? 'hover:bg-[#F4F9FF]/60 opacity-80 hover:opacity-100'
                        : 'bg-[#F4F9FF]/40 hover:bg-[#EAF4FF]/40'
                    }`}
                  >
                    {/* Unread Indicator Bar */}
                    {!isRead && (
                      <span className="absolute left-1.5 top-3.5 h-2 w-2 rounded-full bg-[#368CE7]" />
                    )}

                    {/* Category Icon */}
                    <div className="pl-2">
                      {getCategoryIcon(notif.category, notif.severity)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4
                          className={`text-xs truncate ${
                            isRead ? 'font-semibold text-[#243B53]' : 'font-bold text-[#243B53]'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-[#647A91] whitespace-nowrap shrink-0">
                          {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] leading-relaxed text-[#647A91] line-clamp-2">
                        {notif.message}
                      </p>

                      {/* Action Button & Metadata */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {notif.actionLabel && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-white border border-[#D9E8F5] px-2 py-0.5 text-[10px] font-semibold text-[#368CE7] group-hover:border-[#368CE7] group-hover:bg-[#EAF4FF] transition-colors">
                            <span>{notif.actionLabel}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}

                        {/* Read/Unread Toggle */}
                        <button
                          type="button"
                          onClick={(e) => markAsRead(notif.id, e)}
                          title={isRead ? 'Already read' : 'Mark as read'}
                          className="text-[10px] font-medium text-[#647A91] hover:text-[#368CE7] transition-colors cursor-pointer ml-auto"
                        >
                          {isRead ? 'Read' : 'Mark read'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#D9E8F5] bg-[#F4F9FF]/80 p-2.5 px-3 flex items-center justify-between text-[11px] text-[#647A91]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#249B70] animate-pulse" />
              <span>Real-time Role Sentinel</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                if (role === 'ADMIN') navigate('/admin/dashboard');
                else if (role === 'STAFF') navigate('/staff/dashboard');
                else navigate('/customer/dashboard');
              }}
              className="font-semibold text-[#368CE7] hover:underline cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
