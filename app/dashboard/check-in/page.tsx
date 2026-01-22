'use client';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils'; // Assuming utils exists

export default function CheckInPage() {
    const [checkInDate, setCheckInDate] = useState<Date | undefined>(new Date(2024, 7, 10)); // August 10, 2024
    const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(new Date(2024, 7, 15)); // August 15, 2024
    const [room, setRoom] = useState<string>('');

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)] bg-[#050B14]"> {/* Darker backdrop to simulate modal overlay */}
            {/* Modal Card */}
            <div className="relative w-full max-w-4xl bg-[#0F172A] rounded-3xl border border-[#1E293B] shadow-2xl p-10 animate-in zoom-in-95 duration-300">

                {/* Close Icon */}
                <button className="absolute top-6 right-6 text-[#64748B] hover:text-white transition">
                    <X className="h-6 w-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Guest Check-in</h1>
                    <h2 className="text-xl font-bold text-[#D4AF37]">Johnathan Doe</h2>
                </div>

                {/* Content */}
                <div className="space-y-8">

                    {/* Assign Room */}
                    <div className="space-y-3">
                        <label className="text-[#94A3B8] text-sm font-medium">Assign Room</label>
                        <Select onValueChange={setRoom} value={room}>
                            <SelectTrigger className="h-[52px] bg-[#0F172A] border-[#334155] text-white rounded-xl focus:ring-[#D4AF37]/50">
                                <SelectValue placeholder="Select an available room" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
                                <SelectItem value="101">Room 101 - Deluxe</SelectItem>
                                <SelectItem value="102">Room 102 - Standard</SelectItem>
                                <SelectItem value="205">Room 205 - Premium</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Calendars Row */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Check-in Date */}
                        <div className="space-y-3">
                            <label className="text-[#94A3B8] text-sm font-medium">Check-in Date</label>
                            <div className="p-4 rounded-2xl border border-[#334155] bg-[#0F172A]">
                                <Calendar
                                    mode="single"
                                    selected={checkInDate}
                                    onSelect={setCheckInDate}
                                    month={new Date(2024, 7)} // Fixed month August 2024 for demo
                                    className="w-full pointer-events-none" // Disable interaction to keep static demo look? Or interactive. Interactive is better.
                                // Applying pointer-events-none just to ensure '10' stays selected without user changing it easily for pixel perfect screenshot matching if desired, 
                                // but functional is better. Let's keep interaction.
                                />
                            </div>
                        </div>

                        {/* Check-out Date */}
                        <div className="space-y-3">
                            <label className="text-[#94A3B8] text-sm font-medium">Check-out Date</label>
                            <div className="p-4 rounded-2xl border border-[#334155] bg-[#0F172A]">
                                <Calendar
                                    mode="single"
                                    selected={checkOutDate}
                                    onSelect={setCheckOutDate}
                                    month={new Date(2024, 7)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full h-[56px] bg-[#D4AF37] hover:bg-[#B5952F] text-black text-lg font-bold rounded-xl mt-4 shadow rounded-xl">
                        Assign Room & Check-in
                    </Button>
                </div>
            </div>
        </div>
    );
}
