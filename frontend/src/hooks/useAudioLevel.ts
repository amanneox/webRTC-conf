import { useEffect, useRef, useState } from 'react';

export const useAudioLevel = (stream: MediaStream | null) => {
    const [audioLevel, setAudioLevel] = useState(0);
    const requestRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        if (!stream) {
            setAudioLevel(0);
            return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
            sourceRef.current = audioContext.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateAudioLevel = () => {
                if (!analyserRef.current) return;

                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                const normalizedLevel = Math.min(100, Math.max(0, average * 2.5));
                setAudioLevel(normalizedLevel);

                requestRef.current = requestAnimationFrame(updateAudioLevel);
            };

            updateAudioLevel();
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    }, [stream]);

    return audioLevel;
};
