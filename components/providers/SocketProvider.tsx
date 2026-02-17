'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance = io('http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket'], // force websocket for less latency
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setIsConnected(true);

            // Join role-based room
            const userInfoStr = localStorage.getItem('userInfo') || ((window as any).Cookies?.get('userInfo'));
            if (userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);
                    if (userInfo.role) {
                        socketInstance.emit('join-role', userInfo.role);
                        console.log('Joined role room:', userInfo.role);
                    }
                    if (userInfo._id) {
                         socketInstance.emit('join-room', `user:${userInfo._id}`);
                    }
                } catch (e) {
                    console.error('Error parsing user info for socket', e);
                }
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
