// functions.js
import { myFace, toggleMicButton, toggleVideoButton } from './domElements.js';
import { makeConnection, onPeerConnectionInitialized, waitForPeerConnection } from './peerConnection.js';

export let myStream;
let muted = false;
let cameraOff = false;
let isScreenSharing = false;
export let targetRoomId;
export let userType = 'CUSTOMER';

export async function getMedia(deviceId) {
    const constraints = deviceId
        ? { audio: true, video: { deviceId: { exact: deviceId } } }
        : { audio: true, video: { facingMode: 'user' } };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(constraints);
        myFace.srcObject = myStream;
    } catch (e) {
        console.error('Error getting media:', e);
    }
}

export async function initConsultingRoom(socket) {
    await getMedia();
    await makeConnection(socket);
    onPeerConnectionInitialized();
}

export async function enterRoom(roomId) {
    const socket = io();
    targetRoomId = roomId;

    setupSocketDisconnectionHandlers(socket);

    socket.emit('joinRoom', { roomId: roomId, userType: userType });

    socket.on('roomInfo', async (info) => {
        document.getElementById('fullscreenContainer').style.display = 'flex';
        alert('상담룸에 입장합니다!');
        await initConsultingRoom(socket);
    });

    socket.on('offer', async (offer) => {
        try {
            await waitForPeerConnection();
            await myPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await myPeerConnection.createAnswer();
            await myPeerConnection.setLocalDescription(answer);
            socket.emit('answer', answer, targetRoomId);
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    });

    socket.on('answer', async (answer) => {
        try {
            await myPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    });

    socket.on('ice', (ice) => {
        myPeerConnection.addIceCandidate(ice);
    });
}

export function toggleMic() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
        toggleMicButton.innerText = '마이크 켜기';
        muted = true;
    } else {
        toggleMicButton.innerText = '마이크 끄기';
        muted = false;
    }
}

export function toggleVideo() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if (!cameraOff) {
        toggleVideoButton.innerText = '비디오 끄기';
        cameraOff = true;
    } else {
        toggleVideoButton.innerText = '비디오 켜기';
        cameraOff = false;
    }
}
