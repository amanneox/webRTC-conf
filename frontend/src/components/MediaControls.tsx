import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

type Props = {
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    toggleAudio: () => void;
    toggleVideo: () => void;
    leaveRoom: () => void;
}

const btnBase = "rounded-lg h-14 w-14 border transition-all duration-300 hover:-translate-y-1";
const active = "border-white/20 text-white bg-transparent hover:bg-white/10 hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]";
const inactive = "border-destructive text-destructive hover:bg-destructive hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]";

export const MediaControls = ({ isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo, leaveRoom }: Props) => (
    <div className="flex items-center justify-center gap-4 px-8 py-4 rounded-xl bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all hover:bg-black/70 hover:scale-[1.02] duration-500 hover:border-white/20">
        <Button variant="ghost" size="icon" className={`${btnBase} ${isVideoEnabled ? active : inactive}`} onClick={toggleVideo}>
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </Button>

        <Button variant="ghost" size="icon" className={`${btnBase} ${isAudioEnabled ? active : inactive}`} onClick={toggleAudio}>
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>

        <div className="w-px h-10 bg-white/20 mx-2" />

        <Button
            variant="destructive"
            size="icon"
            className="rounded-lg h-14 w-14 border border-destructive/50 bg-transparent text-destructive hover:bg-destructive hover:text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 transform hover:rotate-90 hover:scale-110"
            onClick={leaveRoom}
        >
            <PhoneOff className="h-6 w-6" />
        </Button>
    </div>
);
