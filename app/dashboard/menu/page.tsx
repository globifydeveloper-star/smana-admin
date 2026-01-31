'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '@/components/providers/SocketProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Image as ImageIcon, Edit2, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    isActive: boolean;
    allergens: string[];
    allergyInfo?: string;
}

import { API_URL } from '@/lib/config';

export default function MenuPage() {
    const { socket } = useSocket();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddMode, setIsAddMode] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Appetizer',
        imageUrl: '',
        allergens: '',
        allergyInfo: ''
    });

    const categories = ['Appetizer', 'Main Course', 'Dessert', 'Beverage'];

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/menu/admin`, { withCredentials: true });
                setMenuItems(data);
            } catch (error) {
                console.error("Failed to fetch menu", error);
                toast.error("Failed to fetch menu");
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const handleSave = async () => {
        try {
            const payload = {
                ...newItem,
                price: parseFloat(newItem.price),
                allergens: newItem.allergens.split(',').map(a => a.trim()).filter(Boolean)
            };

            if (editingId) {
                // Edit existing
                const { data } = await axios.put(`${API_URL}/menu/${editingId}`, payload, { withCredentials: true });
                setMenuItems(prev => prev.map(item => item._id === editingId ? data : item));
                toast.success("Dish updated successfully");
            } else {
                // Create new
                const { data } = await axios.post(`${API_URL}/menu`, payload, { withCredentials: true });
                setMenuItems(prev => [...prev, data]);
                toast.success("Dish added successfully");
            }

            setIsAddMode(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save item", error);
            toast.error("Failed to save item");
        }
    };

    const resetForm = () => {
        setNewItem({ name: '', description: '', price: '', category: 'Appetizer', imageUrl: '', allergens: '', allergyInfo: '' });
        setEditingId(null);
    };

    const handleEdit = (item: MenuItem) => {
        setNewItem({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            category: item.category,
            imageUrl: item.imageUrl,
            allergens: item.allergens.join(', '),
            allergyInfo: item.allergyInfo || ''
        });
        setEditingId(item._id);
        setIsAddMode(true);
    };

    const handleAddNew = () => {
        resetForm();
        setIsAddMode(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const { data } = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            setNewItem(prev => ({ ...prev, imageUrl: data.url }));
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setMenuItems(prev => prev.map(item => item._id === id ? { ...item, isActive: !currentStatus } : item));

            await axios.put(`${API_URL}/menu/${id}`, {
                isActive: !currentStatus
            }, { withCredentials: true });
        } catch (error) {
            // Revert if error
            console.error("Failed to toggle", error);
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            await axios.delete(`${API_URL}/menu/${id}`, { withCredentials: true });
            setMenuItems(prev => prev.filter(item => item._id !== id));
            toast.success("Dish deleted successfully");
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Failed to delete item");
        }
    };

    const filteredItems = (category: string) => menuItems.filter(item => item.category === category);

    return (
        <div className="space-y-6 pt-2 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Food Menu</h1>
                    <p className="text-[#94A3B8]">Manage restaurant offerings.</p>
                </div>

                <Dialog open={isAddMode} onOpenChange={(open) => {
                    setIsAddMode(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew} className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">
                            <Plus className="mr-2 h-4 w-4" /> Add Dish
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0F172A] border-[#334155] text-white">
                        <DialogHeader>
                            <DialogTitle className="text-[#D4AF37]">{editingId ? 'Edit Dish' : 'Add New Dish'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Dish Name</Label>
                                <Input
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    className="bg-[#1E293B] border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Price (AED)</Label>
                                    <Input
                                        type="number"
                                        value={newItem.price}
                                        onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                        className="bg-[#1E293B] border-zinc-700"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <select
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-zinc-700 bg-[#1E293B] px-3 py-2 text-sm text-white"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Input
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    className="bg-[#1E293B] border-zinc-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Allergy Info (Optional)</Label>
                                <Input
                                    value={newItem.allergyInfo}
                                    onChange={e => setNewItem({ ...newItem, allergyInfo: e.target.value })}
                                    className="bg-[#1E293B] border-zinc-700"
                                    placeholder="e.g. Contains nuts, dairy"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Image</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newItem.imageUrl}
                                        readOnly
                                        className="bg-[#1E293B] border-zinc-700"
                                        placeholder="Image URL"
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        <Label
                                            htmlFor="file-upload"
                                            className={cn(
                                                "flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer",
                                                uploading && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {uploading ? <div className="animate-spin mr-2">⏳</div> : <Upload className="h-4 w-4 mr-2" />}
                                            Upload
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} className="bg-[#D4AF37] text-black w-full" disabled={uploading}>
                                {uploading ? 'Uploading...' : (editingId ? 'Update Item' : 'Save Item')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="Appetizer" className="flex-1 flex flex-col">
                <TabsList className="bg-[#1E293B] border border-[#334155] self-start mb-6">
                    {categories.map(cat => (
                        <TabsTrigger
                            key={cat}
                            value={cat}
                            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-zinc-400"
                        >
                            {cat}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map(cat => (
                    <TabsContent key={cat} value={cat} className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredItems(cat).map(item => (
                                <Card key={item._id} className="bg-[#0F172A] border-[#334155] overflow-hidden group hover:border-[#D4AF37]/50 transition-colors">
                                    {/* Image placeholder or real image */}
                                    <div className="h-48 w-full bg-[#1E293B] relative overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.imageUrl || `https://via.placeholder.com/300?text=${item.name}`}
                                            alt={item.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <Switch
                                                checked={item.isActive}
                                                onCheckedChange={() => toggleActive(item._id, item.isActive)}
                                                className="data-[state=checked]:bg-[#D4AF37]"
                                            />
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-white text-lg truncate pr-2">{item.name}</h3>
                                            <span className="text-[#D4AF37] font-mono font-bold">AED {item.price}</span>
                                        </div>
                                        <p className="text-sm text-zinc-500 line-clamp-2 h-10 mb-4">{item.description}</p>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-[#334155] hover:bg-[#334155] hover:text-white"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit2 className="w-3 h-3 mr-2" /> Edit
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="border-red-900/30 text-red-500 hover:bg-red-900/20"
                                                onClick={() => handleDelete(item._id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
