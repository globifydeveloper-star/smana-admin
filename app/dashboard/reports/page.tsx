'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

// Mock Data matching the "Gold Charts" requirement
const occupancyData = [
    { name: 'Mon', available: 30, occupied: 70 },
    { name: 'Tue', available: 25, occupied: 75 },
    { name: 'Wed', available: 20, occupied: 80 },
    { name: 'Thu', available: 15, occupied: 85 },
    { name: 'Fri', available: 10, occupied: 90 },
    { name: 'Sat', available: 5, occupied: 95 },
    { name: 'Sun', available: 10, occupied: 90 },
];

const revenueData = [
    { name: 'Mon', room: 4000, food: 2400 },
    { name: 'Tue', room: 3000, food: 1398 },
    { name: 'Wed', room: 9800, food: 2000 },
    { name: 'Thu', room: 3908, food: 2780 },
    { name: 'Fri', room: 4800, food: 1890 },
    { name: 'Sat', room: 3800, food: 2390 },
    { name: 'Sun', room: 4300, food: 3490 },
];

export default function ReportsPage() {
    return (
        <div className="space-y-6 pt-2 h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
                <p className="text-[#94A3B8]">Hotel performance metrics.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-6">
                {/* Occupancy Chart */}
                <Card className="bg-[#0F172A] border-[#D4AF37]/30 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-[#D4AF37]">Occupancy Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={occupancyData}>
                                <defs>
                                    <linearGradient id="colorOccupied" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#64748B" />
                                <YAxis stroke="#64748B" />
                                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#D4AF37' }}
                                />
                                <Area type="monotone" dataKey="occupied" stroke="#D4AF37" fillOpacity={1} fill="url(#colorOccupied)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Revenue Chart */}
                <Card className="bg-[#0F172A] border-[#D4AF37]/30 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-[#D4AF37]">Revenue Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                <XAxis dataKey="name" stroke="#64748B" />
                                <YAxis stroke="#64748B" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff' }}
                                    cursor={{ fill: '#1E293B' }}
                                />
                                <Legend />
                                <Bar dataKey="room" name="Room Revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="food" name="F&B Revenue" fill="#ffffff" radius={[4, 4, 0, 0]} opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
