'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftFromLine, ArrowRightFromLine, Bell, Utensils, ArrowRight } from 'lucide-react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

export default function DashboardPage() {
    const { socket } = useSocket();
    const [role, setRole] = useState<string>('Admin'); // Default to Admin

    // Stats
    const [stats, setStats] = useState({
        occupied: 0,
        totalRooms: 100, // Hardcoded max for now or fetch
        checkIns: 0,
        requests: 0,
        orders: 0
    });

    // Recent activity
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        // Hydrate role from storage
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
            try {
                const user = JSON.parse(userInfoStr);
                setRole(user.role || 'Admin');
            } catch (e) {
                console.error(e);
            }
        }

        // Fetch Initial Data
        const fetchData = async () => {
            try {
                // Determine what to fetch based on role? Or just fetch all for now since it's light.
                // In a real app we'd have a dashboard-stats endpoint.
                // Simulating fetches or fetching real counts:

                const [roomsRes, ordersRes, requestsRes, guestsRes] = await Promise.allSettled([
                    api.get('/rooms'),
                    api.get('/orders'),
                    api.get('/service-requests'),
                    api.get('/guests')
                ]);

                let newStats = { ...stats };

                if (roomsRes.status === 'fulfilled') {
                    const rooms = roomsRes.value.data.rooms;
                    newStats.occupied = rooms.filter((r: any) => r.status === 'Occupied').length;
                    newStats.totalRooms = roomsRes.value.data.total || 100;
                }

                if (ordersRes.status === 'fulfilled') {
                    const orders = ordersRes.value.data.orders;
                    newStats.orders = orders.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
                }

                if (requestsRes.status === 'fulfilled') {
                    const reqs = requestsRes.value.data;
                    newStats.requests = reqs.filter((r: any) => r.status === 'Open').length;
                }

                if (guestsRes.status === 'fulfilled') {
                    // Approximate check-ins today
                    const guests = guestsRes.value.data;
                    const today = new Date().toDateString();
                    newStats.checkIns = guests.filter((g: any) => g.isCheckedIn && new Date(g.updatedAt).toDateString() === today).length;
                }

                setStats(newStats);

            } catch (err) {
                console.error("Error fetching dashboard stats", err);
            }
        };

        fetchData();
    }, []);


    // Real-time listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('guest-checked-in', (data: any) => {
            setStats(prev => ({ ...prev, occupied: prev.occupied + 1, checkIns: prev.checkIns + 1 }));
            addActivity(`${data.name} checked into Room ${data.roomNumber}.`, 'check-in');
        });

        socket.on('guest-checked-out', (data: any) => {
            setStats(prev => ({ ...prev, occupied: Math.max(0, prev.occupied - 1) }));
            addActivity(`${data.name} checked out.`, 'check-out');
        });

        socket.on('new-food-order', (data: any) => {
            setStats(prev => ({ ...prev, orders: prev.orders + 1 }));
            addActivity(`New food order from Room ${data.roomNumber}.`, 'order');
        });

        socket.on('new-service-request', (data: any) => {
            setStats(prev => ({ ...prev, requests: prev.requests + 1 }));
            addActivity(`New ${data.type} request from Room ${data.roomNumber}.`, 'request');
        });

        return () => {
            socket.off('guest-checked-in');
            socket.off('guest-checked-out');
            socket.off('new-food-order');
            socket.off('new-service-request');
        };
    }, [socket]);

    const addActivity = (main: string, type: string) => {
        setActivities(prev => [{
            id: Date.now(),
            main,
            sub: "Just now",
            type
        }, ...prev.slice(0, 4)]);
    };

    // Filter Logic
    const canSeeOccupied = ['Admin', 'Receptionist', 'Manager'].includes(role);
    const canSeeCheckIns = ['Admin', 'Receptionist', 'Manager'].includes(role);
    const canSeeRequests = ['Admin', 'Housekeeping', 'Manager'].includes(role);
    const canSeeOrders = ['Admin', 'Chef', 'Manager'].includes(role);

    return (
        <div className="space-y-8 max-w-[1600px] pt-2">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-[#94A3B8] text-[15px]">Welcome back, {role}. Here&apos;s a summary of hotel activity.</p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Occupied Rooms */}
                {canSeeOccupied && (
                    <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/10 to-transparent pointer-events-none" />
                        <h3 className="text-[#94A3B8] text-sm font-medium mb-4 relative z-10">Occupied Rooms</h3>
                        <div className="relative z-10">
                            <span className="text-[42px] font-bold text-[#D4AF37] leading-none">
                                {stats.occupied}
                            </span>
                            <span className="text-[24px] text-[#64748B] font-normal">
                                /{stats.totalRooms}
                            </span>
                        </div>
                    </div>
                )}

                {/* Today's Check-ins */}
                {canSeeCheckIns && (
                    <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
                        <h3 className="text-[#94A3B8] text-sm font-medium mb-4 relative z-10">Today&apos;s Check-ins</h3>
                        <div className="text-[42px] font-bold text-[#D4AF37] leading-none relative z-10">
                            {stats.checkIns}
                        </div>
                    </div>
                )}

                {/* Pending Requests */}
                {canSeeRequests && (
                    <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
                        <h3 className="text-[#94A3B8] text-sm font-medium mb-4 relative z-10">Pending Requests</h3>
                        <div className="text-[42px] font-bold text-[#D4AF37] leading-none relative z-10">
                            {stats.requests}
                        </div>
                    </div>
                )}

                {/* Active Food Orders */}
                {canSeeOrders && (
                    <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
                        <h3 className="text-[#94A3B8] text-sm font-medium mb-4 relative z-10">Active Food Orders</h3>
                        <div className="text-[42px] font-bold text-[#D4AF37] leading-none relative z-10">
                            {stats.orders}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activity Section */}
            <div className="mt-8 rounded-2xl border border-[#1E293B] bg-[#0F172A] p-8">
                <h2 className="text-lg font-medium text-white mb-8">Recent Activity</h2>

                <div className="relative space-y-8 pl-4">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[34px] top-4 bottom-4 w-[1px] bg-[#334155]" />

                    {activities.length === 0 && (
                        <div className="text-[#64748B] text-sm">No recent activity</div>
                    )}

                    {activities.map((item, index) => {
                        // Filter activity logic could be added here too, 
                        // but generally seeing all activity (or filtered by backend room subscription) is okay.
                        // Let's hide unrelated activity just in case.
                        if (item.type === 'order' && !canSeeOrders) return null;
                        if (item.type === 'request' && !canSeeRequests) return null;
                        if ((item.type === 'check-in' || item.type === 'check-out') && !canSeeCheckIns) return null;

                        let Icon = ArrowRight;
                        const iconColor = "text-[#D4AF37]";

                        if (item.type === 'check-in') Icon = ArrowRightFromLine;
                        else if (item.type === 'check-out') Icon = ArrowLeftFromLine;
                        else if (item.type === 'request') Icon = Bell;
                        else if (item.type === 'order') Icon = Utensils;

                        return (
                            <div key={item.id} className="relative flex items-center gap-6 group">
                                <div className={cn(
                                    "relative z-10 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#1E293B] border border-[#334155] shadow-sm transition-colors group-hover:border-[#D4AF37]/50"
                                )}>
                                    <Icon className={cn("h-5 w-5", iconColor)} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-medium text-white">
                                        {item.main}
                                    </span>
                                    <span className="text-[13px] text-[#64748B] mt-0.5">
                                        {item.sub}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
