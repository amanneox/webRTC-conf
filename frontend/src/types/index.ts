export interface User {
    id: string;
    name: string;
    email?: string;
    isGuest?: boolean;
}

export interface Room {
    id: string;
    name: string;
    hostId: string;
    createdAt?: string;
    host?: { name: string; email: string };
}

export interface Peer {
    userId: string;
    name?: string;
    stream: MediaStream;
}

export interface Participant {
    userId: string;
    name: string;
    isHost?: boolean;
}

export type MediaKind = 'audio' | 'video';
