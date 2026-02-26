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

// Read the backend socket URL from env (same var used by lib/config.ts)
// Falls back to localhost for local dev
const SOCKET_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            withCredentials: true,
            // Use polling first, then upgrade — more reliable behind proxies/CDNs
            // Pure websocket can fail if the reverse proxy doesn't support upgrades
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketInstance.on('connect', () => {
            console.log('[Socket] Connected:', socketInstance.id);
            setIsConnected(true);

            // Join role-based room
            const userInfoStr =
                localStorage.getItem('userInfo') ||
                (document.cookie.match(/userInfo=([^;]+)/)?.[1]
                    ? decodeURIComponent(document.cookie.match(/userInfo=([^;]+)/)![1])
                    : null);

            if (userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);
                    if (userInfo.role) {
                        socketInstance.emit('join-role', userInfo.role);
                        console.log('[Socket] Joined role room:', userInfo.role);
                    }
                    if (userInfo._id) {
                        socketInstance.emit('join-room', `user:${userInfo._id}`);
                    }
                } catch (e) {
                    console.error('[Socket] Error parsing user info:', e);
                }
            }
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
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
