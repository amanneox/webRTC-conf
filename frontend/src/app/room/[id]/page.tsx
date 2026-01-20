"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useMediaStream } from "@/hooks/useMediaStream"
import { useWebRTC } from "@/hooks/useWebRTC"
import { VideoGrid } from "@/components/VideoGrid"
import { MediaControls } from "@/components/MediaControls"
import { toast } from "sonner"
import { ParticipantsList } from "@/components/ParticipantsList"
import { InviteDialog } from "@/components/InviteDialog"
import { EndSessionDialog } from "@/components/EndSessionDialog"
import { Users } from 'lucide-react';
import { Button } from "@/components/ui/button"

export default function RoomPage() {
    const { id } = useParams()
    const roomId = (Array.isArray(id) ? id[0] : id) || "";
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [roomName, setRoomName] = useState<string>("")
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)

    // Hooks
    const { stream, isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo, muteTrack } = useMediaStream()
    // socket is now a direct object (or null), not a ref
    const socket = useWebSocket(roomId, user)
    const { peers } = useWebRTC(roomId, user, stream, socket)

    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        const initializeUser = async () => {
            let currentUser: any = null;
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (token && storedUser) {
                currentUser = JSON.parse(storedUser);
            } else {
                // Generate Guest User
                const randomId = Math.random().toString(36).substring(2, 9);
                currentUser = {
                    id: `guest-${randomId}`,
                    name: `Guest ${randomId.substring(0, 4)}`,
                    isGuest: true
                };
            }
            setUser(currentUser);

            // Fetch Room to check if Host
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await fetch(`${API_URL}/rooms/${roomId}`);
                if (res.ok) {
                    const room = await res.json();
                    setRoomName(room.name || "Room " + roomId);
                    if (room.hostId === currentUser.id) {
                        setIsHost(true);
                        toast.success("You are the host of this room");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch room details", error);
            }
        };

        if (roomId) initializeUser();
    }, [roomId]);

    // Handle Moderation Events
    useEffect(() => {
        if (!socket) return;

        const onKicked = () => {
            toast.error("You have been kicked from the room.");
            router.push('/');
        };

        const onMutedByHost = ({ kind }: { kind: 'audio' | 'video' }) => {
            muteTrack(kind);
        };

        const onRoomDeleted = () => {
            toast.info("The room has been deleted by the host.");
            router.push('/');
        };

        socket.on('kicked', onKicked);
        socket.on('muted-by-host', onMutedByHost);
        socket.on('room-deleted', onRoomDeleted);

        return () => {
            socket.off('kicked', onKicked);
            socket.off('muted-by-host', onMutedByHost);
            socket.off('room-deleted', onRoomDeleted);
        };
    }, [socket, muteTrack, router]);

    const handleKick = (targetUserId: string) => {
        if (!socket || !user) return;
        socket.emit('kick-participant', {
            roomId,
            targetUserId: targetUserId, // Ensure this matches what VideoGrid passes (logical ID)
            issuerId: user.id
        });
        toast.success("User kicked");
    };

    const handleMute = (targetUserId: string, kind: 'audio' | 'video') => {
        if (!socket || !user) return;
        socket.emit('mute-participant', {
            roomId,
            targetUserId,
            issuerId: user.id,
            kind
        });
        toast.success(`User ${kind} disabled`);
    };

    // Construct participants list
    const allParticipants = user ? [
        { userId: user.id || 'me', name: `${user.name} (You)`, isHost: isHost },
        ...peers
    ] : [];

    if (!user) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-600 animate-pulse">Loading workspace...</div>

    const handleDeleteRoom = async () => {
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/rooms/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                // Notify others via socket
                socket?.emit('room-deleted', { roomId, issuerId: user.id });
                toast.success("Room deleted");
                router.push('/');
            } else {
                toast.error("Failed to delete room");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting room");
        }
    };

    return (
        <div className="h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background text-foreground flex flex-col font-sans overflow-hidden">
            {/* Header - Glassmorphic & Immersive */}
            <header className="px-6 py-4 absolute top-0 left-0 right-0 z-50 flex justify-between items-center bg-gradient-to-b from-background/90 to-transparent pt-6 pb-12 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight drop-shadow-md tracking-tight font-display">{roomName || "Loading..."}</h1>
                        <p className="text-xs text-white/50 font-medium tracking-widest uppercase mt-0.5">Room ID: {roomId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button
                        onClick={() => setIsParticipantsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-transparent hover:bg-white/5 backdrop-blur-md text-white rounded-lg text-sm font-semibold transition-all border border-white/20 hover:border-white/40"
                    >
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Participants</span>
                        <span className="bg-white/10 text-xs px-1.5 py-0.5 rounded-md ml-1 border border-white/10">{allParticipants.length}</span>
                    </button>

                    <InviteDialog roomId={roomId} />

                    {isHost && <EndSessionDialog onConfirm={handleDeleteRoom} />}
                </div>
            </header>

            <ParticipantsList
                participants={allParticipants}
                isOpen={isParticipantsOpen}
                onClose={() => setIsParticipantsOpen(false)}
            />

            {/* Main Content Layout */}
            <div className="flex flex-1 overflow-hidden relative pt-20">

                {/* Visual Content Area */}
                <main className="flex-1 flex flex-col relative w-full h-full p-6">
                    {/* Video Grid Container */}
                    <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm p-4 shadow-inner">
                        <VideoGrid
                            localStream={stream}
                            peers={peers}
                            localUser={user}
                            isAudioEnabled={isAudioEnabled}
                            isVideoEnabled={isVideoEnabled}
                            isHost={isHost}
                            onKick={handleKick}
                            onMute={handleMute}
                        />
                    </div>

                    {/* Floating Controls Bar */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                        <MediaControls
                            isAudioEnabled={isAudioEnabled}
                            isVideoEnabled={isVideoEnabled}
                            toggleAudio={toggleAudio}
                            toggleVideo={toggleVideo}
                            leaveRoom={() => {
                                router.push('/');
                            }}
                        />
                    </div>
                </main>
            </div>
        </div>
    )
}
