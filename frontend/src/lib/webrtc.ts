export const createPeerConnection = (
    userId: string,
    localStream: MediaStream,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onTrack: (stream: MediaStream) => void
) => {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add TURN servers here for production
        ],
    });

    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            onIceCandidate(event.candidate);
        }
    };

    pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
            onTrack(event.streams[0]);
        }
    };

    return pc;
};
