'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useUser } from '@/hooks/useUser';
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
import api from '@/lib/axios';
import { API_URL } from '@/lib/config';

// Exact routes from image
const allRoutes = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['Admin', 'Manager', 'Receptionist', 'Housekeeping','Chef', 'IT', 'Front Office', 'Maintenance'] },
    { label: 'Guests', icon: Users, href: '/dashboard/guests', roles: ['Admin', 'Receptionist', 'Manager'] },
    { label: 'Service Requests', icon: ConciergeBell, href: '/dashboard/requests', roles: ['Admin', 'Receptionist', 'Housekeeping', 'Manager', 'IT', 'Front Office', 'Maintenance' ] },
    { label: 'Food Orders', icon: Utensils, href: '/dashboard/orders', roles: ['Admin', 'Chef', 'Receptionist', 'Manager'] },
    { label: 'Food Menu', icon: BookOpen, href: '/dashboard/menu', roles: ['Admin', 'Chef', 'Manager'] },
    { label: 'Rooms Grid', icon: LayoutGrid, href: '/dashboard/rooms', roles: ['Admin', 'Receptionist', 'Housekeeping', 'Manager', 'IT', 'Front Office', 'Maintenance'] },
    { label: 'User & Staff', icon: UserCog, href: '/dashboard/staff', roles: ['Admin', 'Manager'] },
    // { label: 'Reports', icon: BarChart3, href: '/dashboard/reports', roles: ['Admin', 'Manager'] },
    { label: 'Feedback', icon: MessageSquare, href: '/dashboard/feedback', roles: ['Admin', 'Manager'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useUser();

    const handleLogout = async () => {
        try {
            await api.post(`/auth/logout`);
        } catch (error) {
            console.error('Logout failed', error);
        }
        Cookies.remove('userInfo');
        localStorage.removeItem('userInfo');
        router.push('/login');
    };

    const routes = allRoutes.filter(route => 
        !user || route.roles.includes(user.role)
    );

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

            {/* Logout Button */}
            <div className="px-4 pb-8 mt-auto">
                 <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-[#94A3B8] hover:text-red-400 hover:bg-white/5 transition-all duration-200"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}
