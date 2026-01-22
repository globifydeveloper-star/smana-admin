'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftFromLine, ArrowRightFromLine, Bell, Utensils, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { socket } = useSocket();

    // State matching the numbers in the image exactly
    const [stats, setStats] = useState({
        occupied: 48,
        totalRooms: 80,
        checkIns: 18,
        requests: 7,
        orders: 12
    });

    // Recent activity data matching image
    const [activities, setActivities] = useState([
        {
            id: 1,
            main: "John Doe checked into Room 302.",
            sub: "10 minutes ago",
            type: "check-in"
        },
        {
            id: 2,
            main: "New service request from Room 501.",
            sub: "25 minutes ago",
            type: "request"
        },
        {
            id: 3,
            main: "Food order #2345 confirmed for Room 105.",
            sub: "45 minutes ago",
            type: "order"
        },
        {
            id: 4,
            main: "Jane Smith checked out from Room 212.",
            sub: "1 hour ago",
            type: "check-out"
        }
    ]);

    // Real-time listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('guest-checked-in', (data: any) => {
            setStats(prev => ({ ...prev, occupied: prev.occupied + 1, checkIns: prev.checkIns + 1 }));
            setActivities(prev => [{
                id: Date.now(),
                main: `${data.name} checked into Room ${data.roomNumber}.`,
                sub: "Just now",
                type: "check-in"
            }, ...prev.slice(0, 3)]);
        });

        // Add other listeners...

        return () => {
            socket.off('guest-checked-in');
        };
    }, [socket]);

    return (
        <div className="space-y-8 max-w-[1600px] pt-2">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-[#94A3B8] text-[15px]">Welcome back, Admin. Here&apos;s a summary of hotel activity.</p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-4 gap-6">

                {/* Occupied Rooms */}
                <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                    {/* Glow effect */}
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

                {/* Today's Check-ins */}
                <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
                    <h3 className="text-[#94A3B8] text-sm font-medium mb-4 relative z-10">Today&apos;s Check-ins</h3>
                    <div className="text-[42px] font-bold text-[#D4AF37] leading-none relative z-10">
                        {stats.checkIns}
                    </div>
                </div>

                {/* Pending Requests */}
                <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
                    <h3 className="text-[#94A3B8] text-sm font-medium mb-4 relative z-10">Pending Requests</h3>
                    <div className="text-[42px] font-bold text-[#D4AF37] leading-none relative z-10">
                        {stats.requests}
                    </div>
                </div>

                {/* Active Food Orders */}
                <div className="relative p-6 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
                    <h3 className="text-[#94A3B8] text-sm font-medium mb-4 relative z-10">Active Food Orders</h3>
                    <div className="text-[42px] font-bold text-[#D4AF37] leading-none relative z-10">
                        {stats.orders}
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="mt-8 rounded-2xl border border-[#1E293B] bg-[#0F172A] p-8">
                <h2 className="text-lg font-medium text-white mb-8">Recent Activity</h2>

                <div className="relative space-y-8 pl-4">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[34px] top-4 bottom-4 w-[1px] bg-[#334155]" />

                    {activities.map((item, index) => {
                        let Icon = ArrowRight; // default check-in
                        let iconColor = "text-[#D4AF37]"; // default gold
                        let circleBorder = "border-[#334155]"; // default border

                        if (item.type === 'check-in') {
                            Icon = ArrowRightFromLine;
                            iconColor = "text-[#D4AF37]"; // Gold
                            circleBorder = "border-[#334155]";
                        } else if (item.type === 'check-out') {
                            Icon = ArrowLeftFromLine;
                            iconColor = "text-[#D4AF37]";
                            circleBorder = "border-[#334155]";
                        } else if (item.type === 'request') {
                            Icon = Bell;
                            iconColor = "text-[#D4AF37]";
                        } else if (item.type === 'order') {
                            Icon = Utensils;
                            iconColor = "text-[#D4AF37]";
                        }

                        return (
                            <div key={item.id} className="relative flex items-center gap-6 group">
                                {/* Timeline Icon Circle */}
                                <div className={cn(
                                    "relative z-10 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#1E293B] border border-[#334155] shadow-sm transition-colors group-hover:border-[#D4AF37]/50"
                                )}>
                                    <Icon className={cn("h-5 w-5", iconColor)} />
                                </div>

                                {/* Content */}
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
