import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const useMediaStream = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    useEffect(() => {
        let mounted = true;

        const tryGetMedia = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (mounted) setStream(s);
                return;
            } catch (e: any) {
                console.warn('Full media failed, trying video only...', e);
                if (e.name === 'NotReadableError') {
                    toast.warning('Camera or Mic is busy. Trying fallback...');
                }
            }

            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (mounted) {
                    setStream(s);
                    setIsAudioEnabled(false);
                    toast.warning('Microphone not available, video only.');
                }
                return;
            } catch (e: any) {
                console.warn('Video only failed, trying audio only...', e);
                if (e.name === 'NotReadableError') {
                }
            }

            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                if (mounted) {
                    setStream(s);
                    setIsVideoEnabled(false);
                    toast.warning('Camera not available, audio only.');
                }
                return;
            } catch (e: any) {
                console.error('All media access failed', e);
                if (e.name === 'NotReadableError') {
                    toast.error('Camera/Mic is being used by another app.');
                } else if (e.name === 'NotAllowedError') {
                    toast.error('Permission denied. Please allow access.');
                } else {
                    toast.error('Could not access camera/microphone.');
                }
            }
        };

        tryGetMedia();

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
