import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const useWebSocket = (roomId: string, user: any) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!user || !roomId) return;

        const sock = io(WS_URL, { transports: ['websocket'] });

        sock.on('connect', () => {
            console.log('ws connected');
            sock.emit('join-room', { roomId, userId: user.id, name: user.name });
        });

        sock.on('disconnect', (reason) => {
            if (reason !== 'io client disconnect') {
                toast.loading('Connection lost. Reconnecting...', { id: 'ws-status' });
            }
        });

        sock.on('reconnect', () => {
            toast.success('Reconnected!', { id: 'ws-status' });
        });

        sock.on('connect_error', () => toast.error('Connection failed'));

        setSocket(sock);
        return () => { sock.disconnect(); };
    }, [roomId, user]);

    return socket;
};
