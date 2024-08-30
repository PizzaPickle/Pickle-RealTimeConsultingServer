const myFace = document.getElementById('myFace');
const sharedScreen = document.getElementById('sharedScreen');
const peerFace = document.getElementById('peerFace');

const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const shareScreenBtn = document.getElementById('shareScreen');

const camerasSelect = document.getElementById('cameras');
const microphonesSelect = document.getElementById('microphones');

let myStream;
let screenStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;
let targetRoomId;

const DEVICE_TYPES = {
    AUDIO: 'audioinput',
    VIDEO: 'videoinput',
};

window.addEventListener('beforeunload', () => {
    console.log('페이지 떠남, 소켓 연결 해제');
    socket.disconnect();
});

// roomList 가져오기
// 현재는 id를 입력하고 버튼을 눌렀을 때, socket연결을 하여 목록을 가져오지만
// 서비스에서는 상담룸목록페이지에 입장하게되면 socket연결을 하여 목록을 가져오도록 하면 됨
const showRoomListBtn = document.getElementById('showRoomList');
showRoomListBtn.addEventListener('click', showRoomList);
const roomListContainer = document.getElementById('roomList');

function showRoomList() {
    const socket = io();
    const userId = document.getElementById('pickleUserInput').value;

    socket.emit('requestRoomList', { userId });
    socket.on('receiveRoomList', (roomList) => {
        roomListContainer.innerHTML = '';

        roomList.forEach((room) => {
            const newRoomDiv = document.createElement('div');
            newRoomDiv.classList.add('room');

            const roomInfo = document.createElement('p');
            roomInfo.innerHTML = `
                  <strong>방 ID:</strong> ${room.roomId}<br>
                  <strong>날짜:</strong> ${new Date(room.date)}<br>
                  <strong>고객 ID:</strong> ${room.customerId}<br>
                  <strong>고객 이름:</strong> ${room.customerName}<br>
                  <strong>PB ID:</strong> ${room.pbId}<br>
                  <strong>PB 이름:</strong> ${room.pbName}<br>
                  <strong>PB 지점:</strong> ${room.pbBranchOffice}
      `;

            newRoomDiv.appendChild(roomInfo);

            const newRoomEnterBtn = document.createElement('button');
            newRoomEnterBtn.textContent = '입장하기';
            newRoomEnterBtn.disabled = false;

            const currentTime = new Date();
            const roomTime = new Date(room.date);
            if (roomTime - currentTime >= 10 * 60 * 1000) {
                newRoomEnterBtn.disabled = true;
            }

            newRoomEnterBtn.addEventListener('click', () => joinConsultingRoom(room.roomId));
            newRoomDiv.appendChild(newRoomEnterBtn);
            roomListContainer.appendChild(newRoomDiv);
        });
    });
}

function joinConsultingRoom(roomId) {
    console.log(`입장 버튼 클릭 - 방 ID: ${roomId}`);
    const socket = io();
    console.log(socket);
    socket.emit('joinConsultingRoom', roomId);
    socket.on('consultingRoomInfo', async (roomInfo) => {
        try {
            console.log(roomInfo);
            targetRoomId = roomId;
            await initializeConnectionProcess(socket);
        } catch (error) {
            console.error('상담룸 입장 중 에러 발생:', error);
        }
    });
}
async function initializeConnectionProcess(socket) {
    try {
        await initConsultingRoom(socket);
        await makeAndSendOffer(socket);
        await receiveOfferMakeAnswer(socket);
        await finallyReceiveAnswer(socket);
        await receiveIce(socket);
    } catch (error) {
        console.error('연결 초기화 중 에러 발생:', error);
    }
}

async function initConsultingRoom(socket) {
    try {
        await initCall();
        await makeConnection(socket);
    } catch (error) {
        console.error('상담룸 초기화 중 에러 발생:', error);
    }
}
async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    roomListContainer.hidden = true;
    await getMedia();
}
async function getMedia(deviceId) {
    const initialConstraints = {
        audio: true,
        video: { facingMode: 'user' },
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraints : initialConstraints);
        console.log('myStream 초기화 완료:', myStream);
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
            await getMicrophones();
        }
    } catch (error) {
        console.error('getMedia 오류:', error);
        handleGetMediaError(error);
    }
}

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind == 'videoinput');
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });

        camerasSelect.addEventListener('change', async () => {
            const selectedDeviceId = camerasSelect.value;
            await changeDevice(DEVICE_TYPES.VIDEO, selectedDeviceId);
        });
    } catch (error) {
        console.log(error);
    }
}

async function getMicrophones() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audios = devices.filter((device) => device.kind == 'audioinput');

        const currentAudio = myStream.getAudioTracks()[0];

        microphonesSelect.innerHTML = '';

        audios.forEach((audio) => {
            const option = document.createElement('option');
            option.value = audio.deviceId;
            option.innerText = audio.label;

            if (currentAudio && currentAudio.label === audio.label) {
                option.selected = true;
            }

            microphonesSelect.appendChild(option);
        });

        microphonesSelect.addEventListener('change', async () => {
            const selectedDeviceId = microphonesSelect.value;
            await changeDevice(DEVICE_TYPES.AUDIO, selectedDeviceId);
        });
    } catch (error) {
        console.log('마이크 장치 가져오기 오류:', error);
    }
}

async function changeDevice(deviceType, deviceId) {
    try {
        const constraints = {};

        if (deviceType === DEVICE_TYPES.AUDIO) {
            constraints.audio = { deviceId: { exact: deviceId } };
            constraints.video = myStream.getVideoTracks().length > 0;
        } else if (deviceType === DEVICE_TYPES.VIDEO) {
            constraints.video = { deviceId: { exact: deviceId } };
            constraints.audio = myStream.getAudioTracks().length > 0;
        }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (deviceType === DEVICE_TYPES.AUDIO) {
            updateTrack(newStream.getAudioTracks()[0], 'audio', muteBtn, '마이크 켜기', '마이크 끄기');
        } else if (deviceType === DEVICE_TYPES.VIDEO) {
            updateTrack(newStream.getVideoTracks()[0], 'video', cameraBtn, '카메라 켜기', '카메라 끄기');
            myFace.srcObject = newStream;
        }

        console.log(`${deviceType === DEVICE_TYPES.AUDIO ? '마이크' : '카메라'} 변경 완료:`, deviceId);
    } catch (error) {
        console.error(`${deviceType === DEVICE_TYPES.AUDIO ? '마이크' : '카메라'} 변경 중 오류 발생:`, error);
    }
}

function updateTrack(newTrack, trackType, button, onText, offText) {
    const sender = myPeerConnection.getSenders().find((sender) => sender.track.kind === trackType);
    if (sender) {
        sender.replaceTrack(newTrack);
    }
    const oldTracks = trackType === 'audio' ? myStream.getAudioTracks() : myStream.getVideoTracks();
    oldTracks.forEach((track) => track.stop());
    myStream.removeTrack(oldTracks[0]);
    myStream.addTrack(newTrack);

    const isOff = !newTrack.enabled;
    button.innerText = isOff ? onText : offText;

    if (trackType === 'audio') {
        muted = isOff;
    } else if (trackType === 'video') {
        cameraOff = isOff;
    }
}

function handleGetMediaError(error) {
    console.log(error.name);
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('카메라 장치를 찾을 수 없습니다. 음성만으로 연결합니다.');
        getAudioOnly();
    } else {
        alert('미디어 장치를 가져오는 도중 오류가 발생했습니다.');
        console.error('미디어 오류:', error);
    }
}
async function getAudioOnly() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('오디오 스트림 초기화 완료:', myStream);
    } catch (error) {
        console.error('오디오 스트림 가져오는 중 오류 발생:', error);
        alert('오디오 장치를 가져오는 도중 오류가 발생했습니다.');
    }
}

async function makeConnection(socket) {
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
    myPeerConnection.addEventListener('icecandidate', (event) => handIceEvent(event, socket));
    myPeerConnection.addEventListener('track', handleTrackEvent);

    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handIceEvent(event, socket) {
    console.log('4-1. offer - answer 연결 성공하여 ice 시작');
    socket.emit('ice', event.candidate, targetRoomId);
    console.log('4-2. ice');
}
// TODO: 화면 공유 시 로직 변경
function handleTrackEvent(event) {
    if (event.track.kind === 'video') {
        sharedScreen.srcObject = event.streams[0];
    }
}

async function receiveIce(socket) {
    socket.on('ice', (ice) => {
        console.log('5-1. candidate 수신');
        myPeerConnection.addIceCandidate(ice);
        console.log('5-2. ICE 후보 추가 ');
    });
}

async function makeAndSendOffer(socket) {
    try {
        const offer = await myPeerConnection.createOffer();
        await myPeerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, targetRoomId);
        console.log('1. offer 생성 -> 전송');
    } catch (error) {
        console.error('offer 생성 및 전송 중 에러 발생:', error);
    }
}

async function receiveOfferMakeAnswer(socket) {
    try {
        socket.on('offer', async (offer) => {
            console.log('2-1. offer 수신 ');
            myPeerConnection.setRemoteDescription(offer);
            const answer = await myPeerConnection.createAnswer();
            await myPeerConnection.setLocalDescription(answer);
            console.log('2-2. answer 생성 및 전송 ');
            socket.emit('answer', answer, targetRoomId);
        });
    } catch (error) {
        console.error('offer 수신 및 answer 생성과 전송 중 에러 발생:', error);
    }
}

async function finallyReceiveAnswer(socket) {
    try {
        socket.on('answer', (answer) => {
            console.log('3. answer 수신');
            myPeerConnection.setRemoteDescription(answer);
        });
    } catch (error) {
        console.error('answer 수신 중 에러 발생:', error);
    }
}
