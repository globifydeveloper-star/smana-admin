'use client';

import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSocket } from '@/components/providers/SocketProvider';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isRead: boolean;
    referenceId?: string;
    link?: string;
    createdAt: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const { socket } = useSocket();
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('notification', (newNotification: Notification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Optional: Play sound or show browser notification
        });

        return () => {
            socket.off('notification');
        };
    }, [socket]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification._id);
        }
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="relative p-2.5 rounded-full bg-[#1E293B] hover:bg-[#334155] transition outline-none">
                    <Bell className="h-5 w-5 text-[#94A3B8]" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[#D4AF37] border-2 border-[#1E293B] animate-pulse" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#0F172A] border-[#1E293B] text-white" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                            {unreadCount} New
                        </span>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-[#64748B] text-sm">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y divide-[#1E293B]">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={cn(
                                        "p-4 hover:bg-[#1E293B]/50 transition cursor-pointer relative group",
                                        !notification.isRead && "bg-[#1E293B]/30"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-3">
                                        <div className={cn(
                                            "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                                            notification.type === 'info' && "bg-blue-400",
                                            notification.type === 'success' && "bg-green-400",
                                            notification.type === 'warning' && "bg-yellow-400",
                                            notification.type === 'error' && "bg-red-400",
                                            notification.isRead && "bg-[#64748B]"
                                        )} />
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", notification.isRead ? "text-[#94A3B8]" : "text-white")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-[#64748B] line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-[#475569]">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                                             <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
