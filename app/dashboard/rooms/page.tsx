'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '@/components/providers/SocketProvider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Room {
    _id: string;
    roomNumber: string;
    type: string;
    status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
    floor: number;
}

import { API_URL } from '@/lib/config';

export default function RoomsPage() {
    const { socket } = useSocket();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await axios.get(`${API_URL}/rooms`, { withCredentials: true });
                if (response.data.rooms) {
                    setRooms(response.data.rooms);
                } else if (Array.isArray(response.data)) {
                    setRooms(response.data);
                } else {
                    setRooms([]);
                }
            } catch (error) {
                console.error("Failed to fetch rooms", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('room-status-changed', (updatedRoom: Room) => {
            setRooms(prev => prev.map(r => r._id === updatedRoom._id ? updatedRoom : r));
        });

        return () => {
            socket.off('room-status-changed');
        };
    }, [socket]);

    // Group by floor
    const floors = [1, 2, 3, 4, 5];
    const getRoomsByFloor = (floor: number) => {
        return rooms.filter(r => r.floor === floor && r.roomNumber.includes(searchQuery));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Occupied': return 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'; // Gold
            case 'Cleaning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Maintenance': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
        }
    };

    return (
        <div className="space-y-6 pt-2 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Rooms Grid</h1>
                    <p className="text-[#94A3B8]">Live status of all {rooms.length} rooms.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search room number..."
                        className="pl-9 bg-[#1E293B] border-zinc-700 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-8 pr-2">
                {loading ? (
                    <div className="text-center text-zinc-500 py-10">Loading rooms...</div>
                ) : (
                    floors.map(floor => {
                        const floorRooms = getRoomsByFloor(floor);
                        if (floorRooms.length === 0) return null;

                        return (
                            <div key={floor} className="space-y-4">
                                <h2 className="text-lg font-semibold text-white border-b border-[#334155] pb-2">
                                    Floor {floor}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {floorRooms.map(room => (
                                        <div
                                            key={room._id}
                                            className={cn(
                                                "aspect-square rounded-xl border p-3 flex flex-col justify-between transition-all hover:scale-105 cursor-default",
                                                room.status === 'Occupied' ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]" : "bg-[#1E293B] border-[#334155]"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    "text-lg font-bold font-mono",
                                                    room.status === 'Occupied' ? "text-[#D4AF37]" : "text-white"
                                                )}>
                                                    {room.roomNumber}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{room.type}</span>
                                                <Badge variant="outline" className={cn("text-[10px] justify-center", getStatusColor(room.status))}>
                                                    {room.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
