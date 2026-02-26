'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

const TYPE_DOT: Record<string, string> = {
    info: 'bg-blue-400',
    warning: 'bg-amber-400',
    success: 'bg-emerald-400',
    error: 'bg-red-400',
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { socket } = useSocket();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // ── Fetch notifications from backend ──────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error('[NotificationBell] fetch failed', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ── Real-time: add incoming notifications via socket ──────────────────────
    useEffect(() => {
        if (!socket) return;
        const handleIncoming = (notification: Notification) => {
            setNotifications((prev) => {
                if (prev.some((n) => n._id === notification._id)) return prev;
                
                // Show in-app toast for the new notification!
                toast.info(notification.title, {
                    description: notification.message,
                    duration: 5000,
                    action: notification.link ? {
                        label: 'View',
                        onClick: () => router.push(notification.link!)
                    } : undefined
                });

                return [notification, ...prev];
            });
        };
        socket.on('notification', handleIncoming);
        return () => { socket.off('notification', handleIncoming); };
    }, [socket]);

    // ── Close dropdown on outside click ───────────────────────────────────────
    useEffect(() => {
        function onOutsideClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onOutsideClick);
        return () => document.removeEventListener('mousedown', onOutsideClick);
    }, []);

    const markRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };

    const handleClick = async (notification: Notification) => {
        if (!notification.isRead) await markRead(notification._id);
        setOpen(false);
        if (notification.link) router.push(notification.link);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="relative p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all duration-200"
                aria-label="Notifications"
                id="notification-bell-btn"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-0.5 text-[10px] font-bold text-white bg-indigo-500 rounded-full animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-[380px] max-h-[520px] flex flex-col rounded-xl border border-[#1E293B] bg-[#0F172A] shadow-2xl shadow-black/50 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
                        <span className="text-sm font-semibold text-white">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 text-xs font-normal text-indigo-400">
                                    {unreadCount} new
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white transition-colors"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-[#64748B] hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-12 text-[#64748B] text-sm">Loading…</div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#64748B]">
                                <Bell className="h-8 w-8 opacity-30" />
                                <span className="text-sm">No notifications yet</span>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification._id}
                                    onClick={() => handleClick(notification)}
                                    className={cn(
                                        'w-full text-left px-4 py-3 border-b border-[#1E293B] transition-colors hover:bg-white/5',
                                        !notification.isRead && 'bg-indigo-500/5'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={cn(
                                            'mt-1.5 h-2 w-2 rounded-full flex-shrink-0',
                                            notification.isRead ? 'bg-[#334155]' : (TYPE_DOT[notification.type] || TYPE_DOT.info)
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={cn(
                                                    'text-sm font-medium truncate',
                                                    notification.isRead ? 'text-[#94A3B8]' : 'text-white'
                                                )}>
                                                    {notification.title}
                                                </span>
                                                {notification.link && <ExternalLink className="h-3 w-3 text-[#64748B] flex-shrink-0" />}
                                            </div>
                                            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{notification.message}</p>
                                            <p className="text-[10px] text-[#475569] mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markRead(notification._id); }}
                                                className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-[#64748B] hover:text-white transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-[#1E293B]">
                            <button
                                onClick={() => { setOpen(false); router.push('/dashboard'); }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                View all in Dashboard →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
