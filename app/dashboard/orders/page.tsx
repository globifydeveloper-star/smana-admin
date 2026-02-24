'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '@/lib/axios';
import { useSocket } from '@/components/providers/SocketProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
    name: string;
    quantity: number;
}

interface Order {
    _id: string;
    roomNumber: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
    paymentStatus?: 'pending' | 'success' | 'failed';
    paymentMethod?: string;
    transactionId?: string;
    currency?: string;
    createdAt: string;
}

// Columns definition with Cancelled added
const columns = {
    'Pending': { title: 'Pending', color: 'bg-zinc-500/10 border-zinc-500/30' },
    'Preparing': { title: 'Preparing', color: 'bg-blue-500/10 border-blue-500/30' },
    'Ready': { title: 'Ready', color: 'bg-yellow-500/10 border-yellow-500/30' },
    'Delivered': { title: 'Delivered', color: 'bg-green-500/10 border-green-500/30' },
    'Cancelled': { title: 'Cancelled', color: 'bg-red-500/10 border-red-500/30' }
};

// Payment status badge component
function PaymentStatusBadge({ status }: { status?: string }) {
    if (!status) return null;

    const variants: Record<string, { color: string; label: string }> = {
        success: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: '✓ PAID' },
        pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: '⏳ PENDING' },
        failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '✗ FAILED' }
    };

    const variant = variants[status] || variants.pending;

    return (
        <Badge className={`${variant.color} text-[10px] font-bold px-2 py-0.5 border`}>
            {variant.label}
        </Badge>
    );
}

export default function OrdersPage() {
    const { socket } = useSocket();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/orders');
                if (response.data.orders) {
                    setOrders(response.data.orders);
                } else if (Array.isArray(response.data)) {
                    setOrders(response.data);
                } else {
                    setOrders([]);
                }
            } catch (error) {
                console.error("Fetch orders error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    // Socket Updates
    useEffect(() => {
        if (!socket) return;

        socket.on('new-food-order', (newOrder: Order) => {
            setOrders(prev => [newOrder, ...prev]);
        });

        socket.on('order-status-changed', (updatedOrder: Order) => {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        });

        return () => {
            socket.off('new-food-order');
            socket.off('order-status-changed');
        };
    }, [socket]);

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        const newStatus = destination.droppableId;

        const order = orders.find(o => o._id === draggableId);

        // Optimistic UI Update
        const updatedOrders = orders.map(order =>
            order._id === draggableId ? { ...order, status: newStatus } : order
        );
        setOrders(updatedOrders as Order[]);

        // API Call
        try {
            await api.put(`/orders/${draggableId}/status`, {
                status: newStatus
            });
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const getOrdersByStatus = (status: string) => {
        return orders.filter(o => o.status === status);
    };

    if (loading) return <div className="text-zinc-500 p-8">Loading orders...</div>;

    return (
        <div className="h-full flex flex-col pt-2 overflow-hidden">
            <h1 className="text-3xl font-bold text-white mb-6">Kitchen Display</h1>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex flex-col md:grid md:grid-cols-5 gap-4 min-h-0 overflow-y-auto md:overflow-y-hidden">
                    {Object.entries(columns).map(([columnId, column]) => (
                        <div key={columnId} className="flex flex-col h-full bg-[#1E293B]/30 rounded-xl border border-[#334155] p-4">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex justify-between">
                                {column.title}
                                <Badge variant="secondary" className="bg-[#0F172A]">
                                    {getOrdersByStatus(columnId).length}
                                </Badge>
                            </h2>

                            <Droppable droppableId={columnId}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[#334155] min-h-[100px]"
                                    >
                                        {getOrdersByStatus(columnId).map((order, index) => (
                                            <Draggable
                                                key={order._id}
                                                draggableId={order._id}
                                                index={index}
                                                isDragDisabled={false}
                                            >
                                                {(provided, snapshot) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "bg-[#0F172A] border-[#334155] transition-colors group",
                                                            order.status !== 'Cancelled' && "hover:border-[#D4AF37]/50",
                                                            snapshot.isDragging && "border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]",
                                                            order.status === 'Cancelled' && "opacity-60 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <CardContent className="p-4 space-y-3">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[#D4AF37] font-bold font-mono">
                                                                        Room {order.roomNumber}
                                                                    </span>
                                                                    {/* Payment Status Badge */}
                                                                    <PaymentStatusBadge status={order.paymentStatus} />
                                                                </div>
                                                                <div className="flex items-center text-xs text-zinc-500">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1">
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between text-sm text-zinc-300">
                                                                        <span>{item.name}</span>
                                                                        <span className="text-zinc-500">x{item.quantity}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="pt-2 border-t border-[#334155] flex justify-between items-center">
                                                                <span className="text-xs text-zinc-500 uppercase">Total</span>
                                                                <span className="font-bold text-white">
                                                                    {order.currency || 'AED'} {order.totalAmount}
                                                                </span>
                                                            </div>

                                                            {/* Payment Details */}
                                                            {order.paymentMethod === 'HyperPay' && (
                                                                <div className="pt-2 border-t border-[#334155]/50 flex items-start gap-2">
                                                                    <CreditCard className="w-3 h-3 text-zinc-500 mt-0.5" />
                                                                    <div className="flex-1 text-[10px] text-zinc-500">
                                                                        <div>Method: {order.paymentMethod}</div>
                                                                        {order.transactionId && (
                                                                            <div className="truncate" title={order.transactionId}>
                                                                                TX: {order.transactionId.slice(-8)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Cancelled indicator */}
                                                            {order.status === 'Cancelled' && (
                                                                <div className="flex items-center gap-2 text-xs text-red-400 pt-2 border-t border-red-500/20">
                                                                    <XCircle className="w-3 h-3" />
                                                                    <span>Order Cancelled</span>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
