'use client';

import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MobileSidebar } from '@/components/shared/MobileSidebar';
import { NotificationBell } from './NotificationBell';

export default function Topbar() {
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        // Set initial date
        setDateStr(format(new Date(), "MMMM d, yyyy - h:mm a"));

        // Update every minute
        const interval = setInterval(() => {
            setDateStr(format(new Date(), "MMMM d, yyyy - h:mm a"));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-[#1E293B] bg-[#0F172A]">
            <div className="flex items-center gap-x-4">
                <MobileSidebar />
                <div className="text-white font-medium text-[15px] hidden md:block">
                    {dateStr}
                </div>
                <div className="text-white font-medium text-[13px] md:hidden">
                    {/* Simplified date for mobile if needed, or just same */}
                    {dateStr}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile Avatar */}
                <div className="h-10 w-10 rounded-full bg-[#E2E8F0] flex items-center justify-center overflow-hidden border-2 border-[#334155]">
                    {/* Placeholder for user image */}
                    <svg className="h-6 w-6 text-[#94A3B8]" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
