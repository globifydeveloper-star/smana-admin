'use client';

import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSocket } from '@/components/providers/SocketProvider';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';

type ServiceRequest = {
    _id: string;
    roomNumber: string;
    guestId: {
        _id: string;
        name: string;
    };
    type: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Cancelled';
    priority: 'Normal' | 'Medium' | 'High';
    createdAt: string;
    message?: string;
};

export default function ServiceRequestsPage() {
    const { socket } = useSocket();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/service-requests');
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        if (!socket) return;

        socket.on('new-service-request', (data: ServiceRequest) => {
            setRequests(prev => [data, ...prev]);
        });

        socket.on('request-status-updated', (updatedReq: ServiceRequest) => {
            setRequests(prev => prev.map(req =>
                req._id === updatedReq._id ? updatedReq : req
            ));
        });

        return () => {
            socket.off('new-service-request');
            socket.off('request-status-updated');
        };
    }, [socket]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            // Optimistic update
            setRequests(prev => prev.map(req =>
                req._id === id ? { ...req, status: newStatus as any } : req
            ));

            await api.put(`/service-requests/${id}/status`, {
                status: newStatus
            });
        } catch (error) {
            console.error('Failed to update status:', error);
            // Revert changes if needed, but socket sync usually handles it
            fetchRequests();
        }
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'High': return 'urgent'; 
            case 'Medium': return 'high'; // Reusing 'high' style for Medium as it seemed orange/warning
            case 'Normal': return 'normal';
            default: return 'outline';
        }
    };

    // Map backend status to frontend display (optional, if we want different wording)
    // Backend: Open, In Progress, Resolved, Cancelled
    const formatStatus = (status: string) => {
        return status;
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'All') return true;
        // Priority filter
        return req.priority === filter;
    });

    if (loading) {
        return <div className="text-white p-8">Loading requests...</div>;
    }

    return (
        <div className="space-y-8 max-w-[1600px] pt-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Service Requests</h1>
                    <p className="text-[#94A3B8] text-[15px]">Manage and track all guest service requests.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { name: 'All', color: 'bg-[#1E293B] text-white hover:bg-[#334155]' },
                        { name: 'High', color: 'bg-red-900/40 text-red-500 border border-red-900/50 hover:bg-red-900/60' },
                        { name: 'Medium', color: 'bg-orange-900/40 text-orange-500 border border-orange-900/50 hover:bg-orange-900/60' },
                        { name: 'Normal', color: 'bg-green-900/40 text-green-500 border border-green-900/50 hover:bg-green-900/60' }
                    ].map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setFilter(tab.name)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                                tab.color,
                                filter === tab.name ? "ring-2 ring-offset-2 ring-offset-[#0F172A] ring-white/20" : "opacity-80 hover:opacity-100"
                            )}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Card */}
            <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] overflow-hidden overflow-x-auto">
                <div className="min-w-[1000px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 border-b border-[#1E293B] bg-[#0F172A] p-5 text-xs font-bold text-white tracking-wider uppercase">
                    <div className="col-span-1">Room</div>
                    <div className="col-span-2">Guest</div>
                    <div className="col-span-3">Request Type</div>
                    <div className="col-span-2">Submitted</div>
                    <div className="col-span-2">Priority</div>
                    <div className="col-span-2">Status</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-[#1E293B]">
                    {filteredRequests.map((req) => (
                        <div key={req._id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 transition-colors">
                            <div className="col-span-1 text-white font-medium text-[15px]">{req.roomNumber}</div>
                            <div className="col-span-2 text-[#94A3B8] text-[15px]">
                                {req.guestId?.name || 'Unknown Guest'}
                            </div>
                            <div className="col-span-3">
                                <span className="text-white text-[15px] block">{req.type}</span>
                                {req.message && (
                                    <span className="text-xs text-gray-500 truncate block mt-1">{req.message}</span>
                                )}
                            </div>
                            <div className="col-span-2 text-[#94A3B8] text-[15px]">
                                {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                            </div>
                            <div className="col-span-2">
                                <Badge variant={getPriorityVariant(req.priority)} className="rounded-md px-3 font-normal">
                                    {req.priority}
                                </Badge>
                            </div>
                            <div className="col-span-2">
                                <Select
                                    value={req.status}
                                    onValueChange={(val) => handleStatusChange(req._id, val)}
                                >
                                    <SelectTrigger className="w-full h-8 bg-[#1E293B] border-[#334155] text-gray-300">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1E293B] border-[#334155] text-gray-300">
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredRequests.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No requests found.
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
