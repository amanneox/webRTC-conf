export const createPeerConnection = (
    userId: string,
    localStream: MediaStream,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onTrack: (stream: MediaStream) => void
) => {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
        ],
    });

    // Attach our local tracks so the remote peer receives our audio/video
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    // Fired when ICE agent discovers a network path. Send to remote peer via signaling.
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            onIceCandidate(event.candidate);
        }
    };

    // Fired when the remote peer's media track arrives
    pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
            onTrack(event.streams[0]);
        }
    };

    return pc;
};
