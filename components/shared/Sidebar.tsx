'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    LogOut,
    ConciergeBell,
    Utensils,
    BookOpen,
    LayoutGrid,
    UserCog,
    BarChart3,
    Settings,
    MessageSquare
} from 'lucide-react';

// Exact routes from image
const routes = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Guests', icon: Users, href: '/dashboard/guests' },
    // { label: 'Check-in/Out', icon: LogOut, href: '/dashboard/check-in' }, // LogOut looks like the arrow box
    { label: 'Service Requests', icon: ConciergeBell, href: '/dashboard/requests' },
    { label: 'Food Orders', icon: Utensils, href: '/dashboard/orders' },
    { label: 'Food Menu', icon: BookOpen, href: '/dashboard/menu' },
    { label: 'Rooms Grid', icon: LayoutGrid, href: '/dashboard/rooms' },
    { label: 'User & Staff', icon: UserCog, href: '/dashboard/staff' },
    { label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
    { label: 'Feedback', icon: MessageSquare, href: '/dashboard/feedback' },
    // { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-[#0F172A] text-white border-r border-[#1E293B]">
            {/* Logo Section */}
            <div className="px-6 py-8 mb-4">
                <div className="flex items-center gap-4">
                    {/* Logo Image */}
                    <div className="relative h-10 w-10">
                        <img
                            src="/smana_logo.png"
                            alt="Smana Logo"
                            className="object-contain w-full h-full"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-white tracking-wide">SMANA</h1>
                        <span className="text-xs text-[#64748B]">Al Raffa</span>
                    </div>
                </div>
            </div>

            {/* Nav Items */}
            <div className="px-4 flex-1 space-y-1">
                {routes.map((route) => {
                    const isActive = pathname === route.href;
                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-white/5 text-[#D4AF37]" // Active: Dark bg highlight + Gold text
                                    : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <route.icon className={cn("h-5 w-5", isActive ? "text-[#D4AF37]" : "text-[#94A3B8]")} />
                            {route.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
