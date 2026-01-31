"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star } from "lucide-react";

interface Feedback {
    _id: string;
    roomNumber: string;
    name: string;
    email?: string;
    phone?: string;
    rating: number;
    description: string;
    createdAt: string;
}

import { API_URL } from '@/lib/config';

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                // Assuming Next.js proxies or absolute URL is handled. using relative /api proxy commonly setup in next.config.mjs or localhost:5000 if cors allowed.
                // Admin usually has axios instance with baseURL. Let's assume axios is configured or use direct URL for now.
                // Checking previous code: Admin likely talks to localhost:5000 directly via proxy or CORS.
                const response = await axios.get(`${API_URL}/feedbacks`, { 
                    withCredentials: true 
                });
                
                // Handle pagination wrapper if present
                if (response.data.feedbacks) {
                     setFeedbacks(response.data.feedbacks);
                } else if (Array.isArray(response.data)) {
                     setFeedbacks(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch feedbacks", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbacks();
    }, []);

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return "bg-green-100 text-green-800";
        if (rating >= 3) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (

        <div className="space-y-6 pt-2 h-full flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Guest Feedback</h2>
                    <p className="text-[#94A3B8]">Recent ratings and comments from verified guests.</p>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto rounded-xl border border-[#1E293B] bg-[#0F172A] shadow-sm">
                <Table>
                    <TableHeader className="bg-[#1E293B] sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-[#334155]">
                            <TableHead className="w-[100px] text-[#94A3B8]">Room</TableHead>
                            <TableHead className="text-[#94A3B8]">Guest</TableHead>
                            <TableHead className="text-[#94A3B8]">Rating</TableHead>
                            <TableHead className="max-w-[300px] text-[#94A3B8]">Description</TableHead>
                            <TableHead className="text-[#94A3B8]">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-zinc-300">
                        {feedbacks.length === 0 ? (
                            <TableRow className="hover:bg-transparent border-[#334155]">
                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                    No feedback received yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            feedbacks.map((feedback) => (
                                <TableRow key={feedback._id} className="hover:bg-[#1E293B]/50 border-[#334155] transition-colors">
                                    <TableCell className="font-mono text-[#D4AF37] font-medium">
                                        {feedback.roomNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium text-white">{feedback.name}</span>
                                            {feedback.email && <span className="text-xs text-zinc-500">{feedback.email}</span>}
                                            {feedback.phone && <span className="text-xs text-zinc-500">{feedback.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`flex w-fit items-center gap-1 border-0 ${getRatingColor(feedback.rating)}`}>
                                            {feedback.rating.toFixed(1)} <Star className="h-3 w-3 fill-current" />
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] text-zinc-400">
                                        <div className="line-clamp-2" title={feedback.description}>
                                            {feedback.description}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-500 tabular-nums">
                                        {format(new Date(feedback.createdAt), "MMM d, yyyy h:mm a")}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

}
