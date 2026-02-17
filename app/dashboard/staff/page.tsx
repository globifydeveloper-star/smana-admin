'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Staff {
    _id: string;
    name: string;
    email: string;
    role: string;
    isOnline: boolean;
}

export default function StaffPage() {
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Receptionist'
    });

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/staff');
            setStaffMembers(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch staff');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/staff', formData);
            toast.success('Staff registered successfully');
            setIsDialogOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'Receptionist' });
            fetchStaff();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to register staff');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = (id: string) => {
        // In a real app, this would be an API call
        setStaffMembers(prev => prev.map(s => s._id === id ? { ...s, isOnline: !s.isOnline } : s));
    };

    return (
        <div className="space-y-6 pt-2 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Staff Management</h1>
                    <p className="text-[#94A3B8]">Manage authorized personnel and access.</p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">
                            + Add New Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
                        <DialogHeader>
                            <DialogTitle>Register New Staff</DialogTitle>
                            <DialogDescription className="text-[#94A3B8]">
                                Create a new account for hotel personnel.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddStaff} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="Enter full name" 
                                    className="bg-[#0F172A] border-[#334155]"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="email@smana.com" 
                                    className="bg-[#0F172A] border-[#334155]"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Initial Password</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="bg-[#0F172A] border-[#334155]"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Department / Role</Label>
                                <Select 
                                    value={formData.role} 
                                    onValueChange={v => setFormData({ ...formData, role: v })}
                                >
                                    <SelectTrigger className="bg-[#0F172A] border-[#334155]">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1E293B] border-[#334155] text-white">
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Receptionist">Receptionist</SelectItem>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Chef">Chef</SelectItem>
                                        <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setIsDialogOpen(false)}
                                    className="text-[#94A3B8] hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Staff'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] shadow-sm overflow-hidden overflow-x-auto">
                <div className="min-w-[800px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-medium">Employee</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-[#94A3B8]">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    Loading staff members...
                                </td>
                            </tr>
                        ) : staffMembers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-[#94A3B8]">
                                    No staff members found.
                                </td>
                            </tr>
                        ) : staffMembers.map((staff) => (
                            <tr key={staff._id} className="hover:bg-[#1E293B]/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 bg-[#334155] text-[#D4AF37] border border-[#475569]">
                                            <AvatarFallback>{staff.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-white">{staff.name}</div>
                                            <div className="text-zinc-500 text-xs">{staff.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className="bg-zinc-500/10 text-zinc-300 border-zinc-700 font-normal">
                                        {staff.role}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${staff.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-600'}`} />
                                        <span className={staff.isOnline ? 'text-green-400' : 'text-zinc-500'}>
                                            {staff.isOnline ? 'Active' : 'Offline'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#1E293B] border-[#334155] text-white">
                                            <DropdownMenuItem onClick={() => handleToggleStatus(staff._id)} className="focus:bg-[#334155] focus:text-white cursor-pointer">
                                                {staff.isOnline ? (
                                                    <span className="flex items-center text-red-400">
                                                        <ShieldAlert className="mr-2 h-4 w-4" /> Suspend
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-green-400">
                                                        <ShieldCheck className="mr-2 h-4 w-4" /> Activate
                                                    </span>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
