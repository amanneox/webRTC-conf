import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { createPeerConnection } from '@/lib/webrtc';
import { toast } from 'sonner';

interface Peer {
    userId: string;
    name?: string;
    stream: MediaStream;
}

export const useWebRTC = (roomId: string, user: any, stream: MediaStream | null, socket: Socket | null) => {
    const [peers, setPeers] = useState<Peer[]>([]);
    // Using refs for PCs to avoid re-renders during signaling. 
    // State updates for every ICE candidate would kill performance.
    const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    const addPeer = useCallback((userId: string, name: string, remoteStream: MediaStream) => {
        setPeers((prev) => {
            if (prev.some(p => p.userId === userId)) return prev;
            return [...prev, { userId, name, stream: remoteStream }];
        });
    }, []);

    const removePeer = useCallback((userId: string) => {
        setPeers((prev) => prev.filter((p) => p.userId !== userId));
        const pc = pcsRef.current.get(userId);
        if (pc) {
            pc.close();
            pcsRef.current.delete(userId);
        }
    }, []);

    useEffect(() => {
        if (!socket || !stream || !user) return;

        const handleUserJoined = async ({ userId, name }: { userId: string, name: string }) => {
            toast.success(`${name || 'User'} joined the room`);

            // Prevent duplicate connections if signaling is noisy
            if (pcsRef.current.has(userId)) return;

            const pc = createPeerConnection(
                userId,
                stream,
                (candidate) => socket.emit('ice-candidate', { to: userId, candidate }),
                (remoteStream) => {
                    addPeer(userId, name, remoteStream);
                }
            );

            pcsRef.current.set(userId, pc);

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { to: userId, offer });
            } catch (err) {
                console.error('Error creating offer:', err);
            }
        };

        const handleOffer = async ({ from, name, offer }: { from: string, name?: string, offer: RTCSessionDescriptionInit }) => {
            // Already connected to this peer, ignore duplicate offer
            if (pcsRef.current.has(from)) {
                return;
            }

            const pc = createPeerConnection(
                from,
                stream,
                (candidate) => socket.emit('ice-candidate', { to: from, candidate }),
                (remoteStream) => {
                    addPeer(from, name || 'Participant', remoteStream);
                }
            );

            pcsRef.current.set(from, pc);

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { to: from, answer });
            } catch (err) {
                // Sdp checks failed?
                console.error('Error handling offer:', err);
            }
        };

        const handleAnswer = async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
            const pc = pcsRef.current.get(from);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error('Error setting remote description (answer):', err);
                }
            }
        };

        const handleIceCandidate = async ({ from, candidate }: { from: string, candidate: RTCIceCandidate }) => {
            const pc = pcsRef.current.get(from);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            }
        };

        const handleUserLeft = ({ userId }: { userId: string }) => {
            removePeer(userId);
            toast.info('User left the room');
        };

        const handleExistingUsers = async (users: { userId: string; name: string }[]) => {
            for (const { userId, name } of users) {
                if (pcsRef.current.has(userId)) continue;

                const pc = createPeerConnection(
                    userId,
                    stream,
                    (candidate) => socket.emit('ice-candidate', { to: userId, candidate }),
                    (remoteStream) => {
                        addPeer(userId, name, remoteStream);
                    }
                );

                pcsRef.current.set(userId, pc);

                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { to: userId, offer });
                } catch (err) {
                    console.error('Error creating offer for existing user:', err);
                }
            }
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-left', handleUserLeft);
        socket.on('existing-users', handleExistingUsers);

        // Signal ready after listeners attached to avoid race conditions with 'existing-users'
        socket.emit('ready');

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('user-left', handleUserLeft);
            socket.off('existing-users', handleExistingUsers);
            pcsRef.current.forEach(pc => pc.close());
            pcsRef.current.clear();
            setPeers([]);
        }

    }, [socket, stream, user, addPeer, removePeer]);

    return { peers };
};
