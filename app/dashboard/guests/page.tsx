"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import axios from "axios";
import {
    Search,
    MoreHorizontal,
    User,
    Check,
    X,
    Calendar as CalendarIcon,
    Phone,
    DoorClosed,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Need to check if this exists or just use Dialog trigger directly
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Types
interface Guest {
    _id: string;
    name: string;
    email: string;
    phone: string;
    isCheckedIn: boolean;
    roomNumber?: string;
    checkInDate?: string;
    checkOutDate?: string;
}

interface Room {
    _id: string;
    roomNumber: string;
    type: string;
    status: string;
}

export default function GuestsPage() {
    const { socket } = useSocket();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string>("");
    const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [guestsRes, roomsRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/guests", { withCredentials: true }),
                    axios.get("http://localhost:5000/api/rooms", { withCredentials: true }),
                ]);
                setGuests(guestsRes.data);
                const roomsData = roomsRes.data;
                setRooms(roomsData.rooms || (Array.isArray(roomsData) ? roomsData : []));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on("guest-registered", (newGuest: Guest) => {
            setGuests((prev) => [newGuest, ...prev]);
        });

        socket.on("guest-checked-in", (updatedGuest: Guest) => {
            setGuests((prev) =>
                prev.map((g) => (g._id === updatedGuest._id ? updatedGuest : g))
            );
            // Also update room status locally if needed, but fetching rooms again might be cleaner
            // For now, let's just re-fetch rooms to keep list accurate
            axios.get("http://localhost:5000/api/rooms", { withCredentials: true }).then((res) => {
                const roomsData = res.data;
                setRooms(roomsData.rooms || (Array.isArray(roomsData) ? roomsData : []));
            });
        });

        socket.on("guest-checked-out", (updatedGuest: Guest) => {
            setGuests((prev) =>
                prev.map((g) => (g._id === updatedGuest._id ? updatedGuest : g))
            );
            axios.get("http://localhost:5000/api/rooms", { withCredentials: true }).then((res) => {
                const roomsData = res.data;
                setRooms(roomsData.rooms || (Array.isArray(roomsData) ? roomsData : []));
            });
        });

        return () => {
            socket.off("guest-registered");
            socket.off("guest-checked-in");
            socket.off("guest-checked-out");
        };
    }, [socket]);

    // Filter Logic
    const filteredGuests = guests.filter(
        (guest) =>
            guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.phone.includes(searchQuery)
    );

    // Handlers
    const handleOpenCheckIn = (guest: Guest) => {
        setSelectedGuest(guest);
        setSelectedRoom(""); // Reset
        setCheckOutDate(undefined); // Reset
        setIsCheckInOpen(true);
    };

    const handleCheckInSubmit = async () => {
        if (!selectedGuest || !selectedRoom) return;

        try {
            await axios.post(
                "http://localhost:5000/api/guests",
                {
                    email: selectedGuest.email,
                    name: selectedGuest.name,
                    phone: selectedGuest.phone,
                    roomNumber: selectedRoom,
                    checkOutDate: checkOutDate,
                },
                { withCredentials: true }
            );

            setIsCheckInOpen(false);
            // State updates handled by socket
        } catch (error) {
            console.error("Check-in failed:", error);
            alert("Check-in failed. Please try again.");
        }
    };

    const handleCheckOut = async (guestId: string) => {
        if (!confirm("Are you sure you want to check out this guest?")) return;

        try {
            await axios.post(
                `http://localhost:5000/api/guests/check-out/${guestId}`,
                {},
                { withCredentials: true }
            );
            // State updates handled by socket
        } catch (error) {
            console.error("Check-out failed:", error);
            alert("Check-out failed. Please try again.");
        }
    };

    // Available Rooms (only Available ones)
    const availableRooms = Array.isArray(rooms) ? rooms.filter((r) => r.status === "Available") : [];

    return (
        <div className="space-y-6 pt-2 h-full flex flex-col">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Guests</h1>
                    <p className="text-[#94A3B8]">Manage guest check-ins and profiles.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by name or phone..."
                        className="pl-9 bg-[#1E293B] border-zinc-700 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Guests Table */}
            <div className="flex-1 overflow-auto rounded-xl border border-[#1E293B] bg-[#0F172A] shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#94A3B8] uppercase bg-[#1E293B] sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 font-medium">Guest</th>
                            <th className="px-6 py-4 font-medium">Contact</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Room</th>
                            <th className="px-6 py-4 font-medium w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                    Loading guests...
                                </td>
                            </tr>
                        ) : filteredGuests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                    No guests found.
                                </td>
                            </tr>
                        ) : (
                            filteredGuests.map((guest) => (
                                <tr
                                    key={guest._id}
                                    className="hover:bg-[#1E293B]/50 transition-colors group"
                                >
                                    {/* Name & Avatar */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-[#334155]">
                                                <AvatarImage
                                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${guest.name}&backgroundColor=1e293b&textColor=D4AF37`}
                                                />
                                                <AvatarFallback className="bg-[#1E293B] text-[#D4AF37]">
                                                    {guest.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-white">
                                                {guest.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[#94A3B8]">
                                            <Phone className="h-3.5 w-3.5" />
                                            {guest.phone}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-normal border",
                                                guest.isCheckedIn
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                            )}
                                        >
                                            {guest.isCheckedIn ? "Checked In" : "Not Checked In"}
                                        </Badge>
                                    </td>

                                    {/* Room */}
                                    <td className="px-6 py-4">
                                        {guest.roomNumber ? (
                                            <span className="text-[#D4AF37] font-medium font-mono text-base">
                                                {guest.roomNumber}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">-</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-[#334155]"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#1E293B] border-[#334155] text-white">
                                                {!guest.isCheckedIn ? (
                                                    <DropdownMenuItem
                                                        onClick={() => handleOpenCheckIn(guest)}
                                                        className="focus:bg-[#334155] focus:text-[#D4AF37] cursor-pointer"
                                                    >
                                                        <Check className="mr-2 h-4 w-4" /> Check In
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => handleCheckOut(guest._id)}
                                                        className="focus:bg-[#334155] focus:text-red-400 cursor-pointer text-red-400"
                                                    >
                                                        <X className="mr-2 h-4 w-4" /> Check Out
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Check-in Modal */}
            <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                <DialogContent className="sm:max-w-[425px] bg-[#0F172A] border-[#334155] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-[#D4AF37] text-xl font-serif">
                            Guest Check-in
                        </DialogTitle>
                        <p className="text-zinc-400 text-sm mt-1">
                            Assign a room for <span className="text-white font-medium">{selectedGuest?.name}</span>.
                        </p>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Room Select */}
                        <div className="grid gap-2">
                            <Label htmlFor="room" className="text-zinc-300">
                                Select Room
                            </Label>
                            <Select
                                value={selectedRoom}
                                onValueChange={setSelectedRoom}
                            >
                                <SelectTrigger className="bg-[#1E293B] border-zinc-700 text-white focus:ring-[#D4AF37]">
                                    <SelectValue placeholder="Select a vacant room" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
                                    {availableRooms.length === 0 ? (
                                        <div className="p-2 text-sm text-zinc-500">No rooms available</div>
                                    ) : (
                                        availableRooms.map((room) => (
                                            <SelectItem key={room._id} value={room.roomNumber} className="focus:bg-[#334155] focus:text-[#D4AF37]">
                                                Room {room.roomNumber} ({room.type})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Check-out Date */}
                        <div className="grid gap-2">
                            <Label className="text-zinc-300">Checkout Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-[#1E293B] border-zinc-700 text-white hover:bg-[#334155] hover:text-white",
                                            !checkOutDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {checkOutDate ? format(checkOutDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#1E293B] border-[#334155]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={checkOutDate}
                                        onSelect={(date) => {
                                            setCheckOutDate(date);
                                            // Close logic would require controlling the Popover state, 
                                            // but standard Radix popover closes on click outside. 
                                            // For now, this is standard behavior.
                                            // If auto-close is needed, I need a state variable `isCalendarOpen`.
                                        }}
                                        initialFocus
                                        className="bg-[#0F172A] text-white"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleCheckInSubmit}
                            disabled={!selectedRoom}
                            className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-black font-semibold"
                        >
                            Assign Room & Check-in
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
