import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const useMediaStream = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    useEffect(() => {
        let mounted = true;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(s => mounted && setStream(s))
            .catch(() => toast.error('Could not access camera/microphone'));

        return () => {
            mounted = false;
            stream?.getTracks().forEach(t => t.stop());
        };
    }, []);

    const toggleVideo = useCallback(() => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsVideoEnabled(track.enabled);
        }
    }, [stream]);

    const toggleAudio = useCallback(() => {
        if (!stream) return;
        const track = stream.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsAudioEnabled(track.enabled);
        }
    }, [stream]);

    const muteTrack = useCallback((kind: 'audio' | 'video') => {
        if (!stream) return;
        const tracks = kind === 'video' ? stream.getVideoTracks() : stream.getAudioTracks();
        tracks.forEach(t => t.enabled = false);
        kind === 'video' ? setIsVideoEnabled(false) : setIsAudioEnabled(false);
        toast.warning(`Your ${kind} was muted by the host.`);
    }, [stream]);

    return { stream, isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio, muteTrack };
};
