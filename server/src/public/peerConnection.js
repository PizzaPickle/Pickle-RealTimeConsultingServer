// peerConnection.js
export let myPeerConnection;
let peerConnectionResolve;
let peerConnectionReject;
export let isPeerConnectionInitialized = false;

export function waitForPeerConnection() {
    if (isPeerConnectionInitialized) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        peerConnectionResolve = resolve;
        peerConnectionReject = reject;
    });
}

export function onPeerConnectionInitialized() {
    isPeerConnectionInitialized = true;
    if (peerConnectionResolve) {
        peerConnectionResolve();
    }
}

export async function makeConnection(socket) {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun4.l.google.com:19302',
                ],
            },
        ],
    });

    myPeerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log('sent candidate');
            socket.emit('ice', event.candidate, targetRoomId);
        }
    });

    myPeerConnection.addEventListener('track', handleTrackEvent);

    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    onPeerConnectionInitialized();
}

function handleTrackEvent(event) {
    const stream = event.streams[0];
    if (event.track.kind === 'video') {
        if (isScreenSharing && event.track.label.includes('screen')) {
            sharedScreen.srcObject = stream;
        } else {
            peerFace.srcObject = stream;
        }
    }
}
