import { useEffect, useRef } from 'react';
import { MicOff, VideoOff, UserX } from 'lucide-react';
import { Button } from './ui/button';
import { useAudioLevel } from '@/hooks/useAudioLevel';

interface VideoGridProps {
    localStream: MediaStream | null;
    peers: { userId: string; name?: string; stream: MediaStream }[];
    localUser: { name: string };
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isHost: boolean;
    onKick?: (userId: string) => void;
    onMute?: (userId: string, kind: 'audio' | 'video') => void;
}

const AudioVisualizer = ({ level }: { level: number }) => {
    return (
        <div className="flex items-end gap-0.5 h-3">
            <div
                className="w-1 bg-primary rounded-sm transition-all duration-100"
                style={{ height: `${Math.max(20, Math.min(100, level * 1.2))}%` }}
            />
            <div
                className="w-1 bg-primary rounded-sm transition-all duration-100 delay-50"
                style={{ height: `${Math.max(20, Math.min(100, level * 0.8))}%` }}
            />
            <div
                className="w-1 bg-primary rounded-sm transition-all duration-100 delay-75"
                style={{ height: `${Math.max(20, Math.min(100, level * 0.5))}%` }}
            />
        </div>
    );
}

const VideoPlayer = ({
    stream,
    muted = false,
    name,
    userId,
    isHost = false,
    onKick,
    onMute
}: {
    stream: MediaStream;
    muted?: boolean;
    name?: string;
    userId?: string;
    isHost?: boolean;
    onKick?: (userId: string) => void;
    onMute?: (userId: string, kind: 'audio' | 'video') => void;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioLevel = useAudioLevel(stream);
    const isSpeaking = audioLevel > 10;

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, name]);

    return (
        <div className={`relative group rounded-lg overflow-hidden bg-gray-900 aspect-video border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:z-10 ${isSpeaking ? 'border-primary/50 shadow-[0_0_20px_rgba(36,158,148,0.4)] ring-1 ring-primary/30' : 'border-white/5 shadow-xl'}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md text-white text-xs font-medium flex items-center gap-2.5">
                    <AudioVisualizer level={audioLevel} />
                    {name || "User"}
                </div>
            </div>

            {isHost && userId && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0"
                        onClick={() => onMute?.(userId, 'audio')}
                        title="Mute Audio"
                    >
                        <MicOff className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0"
                        onClick={() => onMute?.(userId, 'video')}
                        title="Disable Video"
                    >
                        <VideoOff className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7 bg-red-500/80 hover:bg-red-600"
                        onClick={() => onKick?.(userId)}
                        title="Kick Participant"
                    >
                        <UserX className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export const VideoGrid = ({
    localStream,
    peers,
    localUser,
    isAudioEnabled,
    isVideoEnabled,
    isHost,
    onKick,
    onMute
}: VideoGridProps) => {
    const totalParticipants = (localStream ? 1 : 0) + peers.length;
    const getGridClass = () => {
        if (totalParticipants === 1) return "grid-cols-1 max-w-4xl";
        if (totalParticipants <= 4) return "grid-cols-2 max-w-6xl";
        if (totalParticipants <= 9) return "grid-cols-3 max-w-[1400px]";
        if (totalParticipants <= 16) return "grid-cols-4 max-w-full";
        return "grid-cols-5 max-w-full";
    };

    return (
        <div className={`grid ${getGridClass()} gap-4 w-full h-full p-4 place-content-center mx-auto transition-all duration-500`}>
            {localStream && (
                <VideoPlayer stream={localStream} muted={true} name={`${localUser.name} (You)`} />
            )}

            {peers.map((peer) => (
                <VideoPlayer
                    key={peer.userId}
                    stream={peer.stream}
                    name={peer.name}
                    userId={peer.userId}
                    isHost={isHost}
                    onKick={onKick}
                    onMute={onMute}
                />
            ))}
        </div>
    );
};
