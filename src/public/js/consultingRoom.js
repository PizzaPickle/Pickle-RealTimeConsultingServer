let socket;
const myFace = document.getElementById('myFace');
const sharedScreen = document.getElementById('sharedScreen');
const peerFace = document.getElementById('peerFace');

const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const shareScreenBtn = document.getElementById('shareScreen');

const camerasSelect = document.getElementById('cameras');
const microphonesSelect = document.getElementById('microphones');
const chatToggle = document.getElementById('chatToggle');
const sendBtn = document.getElementById('sendButton');
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const videoContainer = document.getElementById('videoContainer');
videoContainer.classList.add('video-container');
myFace.classList.add('video');
peerFace.classList.add('video');
let myStream;
let screenStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;
let myDataChannel;
let isScreenSharing = false;
let isPeerScreenSharing = false;
let targetRoomId;
const { roomId, userId, userName } = window.ROOM_DATA;
const roomTitle = document.getElementById('roomTitle');
// 페이지 로드 시 자동으로 상담방 입장
window.addEventListener('load', () => {
    socket = io();
    targetRoomId = roomId;
    joinConsultingRoom(roomId);
    roomTitle.innerHTML = `${userName}님의 상담룸`;
    muteBtn.addEventListener('click', handleMuteClick); // 마이크 켜기/끄기 버튼 클릭 시
    cameraBtn.addEventListener('click', handleCameraClick); // 카메라 켜기/끄기 버튼 클릭 시
    sendBtn.addEventListener('click', handleSendClick); // 채팅 보내기 버튼 클릭 시
    leaveRoomBtn.addEventListener('click', () => handleLeaveRoom(socket)); // 방 나가기 버튼 클릭 시
    shareScreenBtn.addEventListener('click', handleShareClick); // 화면 공유 버튼 클릭 시
    chatToggle.addEventListener('click', toggleChat); // 채팅 토글 버튼 클릭 시

    targetRoomId = roomId; // 상담룸 ID 설정
    joinConsultingRoom(roomId); // 상담룸 입장
    roomTitle.innerHTML = `${userName}님의 상담룸`; // 방 제목 설정
});

const DEVICE_TYPES = {
    AUDIO: 'audioinput',
    VIDEO: 'videoinput',
};
STREAM_TYPES = {
    MY_FACE: 'myFace',
    PEER_FACE: 'peerFace',
    SHARED_SCHREEN: 'sharedScreen',
};
const ACTION_STREAM_TYPES = {
    PEERFACE: 'peerface',
    SCREENSHARE: 'screenshare',
    STOP_PEERFACE: 'stopPeerface',
    STOP_SCREENSHARE: 'stopScreenshare',
};
const MESSAGE_TYPES = { METADATA: 'metadata', CHAT: 'chat', SYSTEM: 'system' };

window.addEventListener('beforeunload', () => {
    console.log('페이지 떠남, 소켓 연결 해제');
    socket.disconnect();
});
const leaveRoomBtn = document.getElementById('leaveRoom');
/**
 * 상담룸 입장하기 버튼을 눌렀을 때, 소켓연결을 통해 해당하는 상담룸 정보를 가져오는 함수
 * @param {string} roomId 상담룸 고유 번호
 */
function joinConsultingRoom(roomId) {
    console.log(`입장 - 방 ID: ${roomId}`);
    socket.emit('joinConsultingRoom', { userId, roomId, userName });
    socket.on('joinedConsultingRoom', async (roomInfo) => {
        try {
            console.log(roomInfo);
            await initializeConnectionProcess(socket);
            socket.on('newUserJoined', ({ userName, message }) => {
                makeConnection(socket);
            });
            leaveRoomBtn.addEventListener('click', () =>
                handleLeaveRoom(socket)
            );
        } catch (error) {
            console.error('상담룸 입장 중 에러 발생:', error);
        }
    });
}
/**
 * 연결 로직들에 필요한 함수들을 소켓으로 초기화하는 함수
 * @param {socket} socket 연결된 소켓
 */
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
/**
 * 상담룸을 초기화하는 함수들을 관리하는 함수
 * @param {socket} socket 연결된 소켓
 */
async function initConsultingRoom(socket) {
    try {
        await initCall();
        await makeConnection(socket);
    } catch (error) {
        console.error('상담룸 초기화 중 에러 발생:', error);
    }
}
/**
 * 필요없는 UI, 필요한 UI 관리하면서 내 영상을 가져옴
 */
async function initCall() {
    call.hidden = false;
    await getMedia();
    updateShareScreenButton();
}

/**
 * 초기에 스트림을 가져오는 함수
 * @param {string} deviceId 디바이스 고유 ID
 */
async function getMedia(deviceId) {
    const constraints = {
        audio: true,
        video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'user' },
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(constraints);
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
            await getMicrophones();
        }
    } catch (error) {
        console.error('getMedia error:', error);
        handleGetMediaError(error);
    }
}
/**
 * 카메라 목록 가져오는 함수
 */
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
/**
 * 마이크 목록 가져오는 함수
 */
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

/**
 * 디바이스가 바꼈을 때, 스트림에 새롭게 적용하는 함수
 * @param {DEVICE_TYPES} deviceType audioinput, videoinput
 * @param {string} deviceId 디바이스 고유 아이디
 */
async function changeDevice(deviceType, deviceId) {
    try {
        const constraints = {};
        constraints[deviceType === DEVICE_TYPES.AUDIO ? 'audio' : 'video'] = {
            deviceId: { exact: deviceId },
        };
        const newStream = await navigator.mediaDevices.getUserMedia(
            constraints
        );

        updateTrack(newStream, deviceType);

        if (deviceType === DEVICE_TYPES.AUDIO) {
            updateMuteButton();
        } else if (deviceType === DEVICE_TYPES.VIDEO) {
            updateCameraButton();
        }
    } catch (error) {
        console.error(
            `${
                deviceType === DEVICE_TYPES.AUDIO ? '마이크' : '카메라'
            } 변경 중 오류 발생:`,
            error
        );
    }
}
/**
 * 마이크 켜기/끄기 상태에 따라 버튼 내용을 바꿔주는 함수
 */
function updateMuteButton() {
    const audioTrack = myStream.getAudioTracks()[0];
    if (audioTrack) {
        muted = !audioTrack.enabled;
        muteBtn.innerHTML = muted
            ? '<i class="fas fa-microphone-slash"></i>'
            : '<i class="fas fa-microphone"></i>';
    }
}

/**
 * 바디오 켜기/끄기 상태에 따라 버튼 내용을 바꿔주는 함수
 */
function updateCameraButton() {
    const videoTrack = myStream.getVideoTracks()[0];
    if (videoTrack) {
        cameraOff = !videoTrack.enabled;
        cameraBtn.innerHTML = cameraOff
            ? '<i class="fas fa-video-slash"></i>'
            : '<i class="fas fa-video"></i>';
    }
}

/**
 * 트랙의 타입에 따라 트랙을 업데이트 하는 함수
 * @param {MediaStream} newStream
 * @param {DEVICE_TYPES} deviceType audioinput, videoinput
 */
function updateTrack(newStream, deviceType) {
    const trackType = deviceType === DEVICE_TYPES.AUDIO ? 'audio' : 'video';
    const sender = myPeerConnection
        .getSenders()
        .find((sender) => sender.track.kind === trackType);
    if (sender)
        sender.replaceTrack(
            newStream.getTracks().find((track) => track.kind === trackType)
        );

    const oldTracks =
        trackType === 'audio'
            ? myStream.getAudioTracks()
            : myStream.getVideoTracks();
    oldTracks.forEach((track) => track.stop());
    myStream.removeTrack(oldTracks[0]);
    myStream.addTrack(
        newStream.getTracks().find((track) => track.kind === trackType)
    );

    console.log(`${trackType} 트랙이 업데이트되었습니다.`);
}
/**
 * 미디어 에러 발생 시 처리 하는 함수
 * @param {Error} error 에러내용
 */
function handleGetMediaError(error) {
    console.log(error.name);
    if (
        error.name === 'NotFoundError' ||
        error.name === 'DevicesNotFoundError'
    ) {
        alert('카메라 장치를 찾을 수 없습니다. 음성만으로 연결합니다.');
        getAudioOnly();
    } else {
        alert('미디어 장치를 가져오는 도중 오류가 발생했습니다.');
        console.error('미디어 오류:', error);
    }
}

/**
 * 오디오만 가져오는 함수
 */
async function getAudioOnly() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });
        console.log('오디오 스트림 초기화 완료:', myStream);
    } catch (error) {
        console.error('오디오 스트림 가져오는 중 오류 발생:', error);
        alert('오디오 장치를 가져오는 도중 오류가 발생했습니다.');
    }
}

/**
 * connection 연결 설정 함수
 * @param {socket} socket 연결된 소켓
 */
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
    myPeerConnection.addEventListener('icecandidate', (event) =>
        handleIceEvent(event, socket)
    );
    myPeerConnection.addEventListener('track', handleTrackEvent);
    myPeerConnection.addEventListener('iceconnectionstatechange', (event) =>
        handleICEConnectionStateChange(event)
    );
    myPeerConnection.onnegotiationneeded = async () => {
        console.log('Signaling State:', myPeerConnection.signalingState);
        try {
            if (myPeerConnection.signalingState != 'stable') {
                console.log(
                    '현재 연결 상태가 안정적이지 않아 재협상을 보류합니다.'
                );
                return; // 협상 중이면 협상 요청을 보류
            }
            console.log('Negotiation needed event fired');
            await makeAndSendOffer(socket);
        } catch (err) {
            console.error('협상 중 에러 발생:', err);
        }
    };
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleICEConnectionStateChange(event) {
    console.log('ICE 연결 상태:', myPeerConnection.iceConnectionState);
    switch (myPeerConnection.iceConnectionState) {
        case 'disconnected':
        case 'failed':
        case 'closed':
            handlePeerDisconnection();
            break;
        case 'connected':
            console.log('Peer 연결 성공');
            // TODO: 상대방 CUSTOM
            addSystemMessageToChat(`상대방이 입장했습니다.`);
            break;
    }
}
/**
 * 상대방과 연결이 끊어졌을 때 실행하는 함수
 */
function handlePeerDisconnection() {
    console.log('Peer 연결이 끊어졌습니다.');
    if (isScreenSharing) stopScreenShare();

    // 채팅창에 메시지 추가
    // TODO: 상대방 CUSTOM
    addSystemMessageToChat(`상대방이 퇴장했습니다.`);

    // 비디오 스트림 중지
    stopStream(
        peerFace.srcObject,
        'peerFace',
        ACTION_STREAM_TYPES.STOP_PEERFACE
    );
    stopStream(
        sharedScreen.srcObject,
        'sharedScreen',
        ACTION_STREAM_TYPES.STOP_SCREENSHARE
    );

    // myPeerConnection.disconnect();
    isPeerScreenSharing = false;
    isScreenSharing = false;
    myDataChannel.close();
    myDataChannel = null;
    // UI 업데이트
    updateUIForDisconnection();
}
function updateUIForConnection() {
    peerFace.style.display = 'block';
    updateVideoLayout();
}
/**
 * 상대방 비디오 요소를 숨기는 홤수
 */
function updateUIForDisconnection() {
    peerFace.srcObject = null;
    sharedScreen.srcObject = null;
    peerFace.style.display = 'none';
    sharedScreen.style.display = 'none';
    updateVideoLayout();
}
/**
 * 시스템 상에서 알려주는 메시지
 * @param {string} message 메시지
 */
function addSystemMessageToChat(message) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>Pickle:</strong> ${message}`;
    messageElement.style.color = 'blue';
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * sdp 수립 시, 자동적으로 실행되는 함수
 * @param {Event} event 이벤트
 * @param {socket} socket 연결된 소켓
 */
function handleIceEvent(event, socket) {
    console.log('4-1. offer - answer 연결 성공하여 ice 시작');
    const ice = event.candidate;
    console.log('handleIceEvent ice');
    if (socket) socket.emit('ice', { ice, roomId: targetRoomId });
    console.log('4-2. ice');
}

function handleTrackEvent(event) {
    const [stream] = event.streams;
    console.log('handleTrackEvent 실행중');
    if (event.track.kind === 'video') {
        if (isPeerScreenSharing) {
            sharedScreen.srcObject = stream;
            sharedScreen.style.display = 'block';
            console.log(isScreenSharing);
            console.log(
                '수신된 화면 공유 스트림을 sharedScreen에 추가했습니다.'
            );
        } else {
            peerFace.srcObject = stream;
            console.log('수신된 웹캠 스트림을 peerFace에 추가했습니다.');
        }
    }
    updateVideoLayout();
}

async function receiveIce(socket) {
    socket.on('ice', (ice) => {
        console.log('5-1. candidate 수신');
        myPeerConnection.addIceCandidate(ice);
        console.log('5-2. ICE 후보 추가 ');
    });
}
/**
 * SDP를 수립하기 위해 첫 번째로 offer를 생성하여 전송하는 함수
 * 이 때, DataChannel도 생성함
 * @param {socket} socket 연결된 소켓
 */
async function makeAndSendOffer(socket) {
    try {
        if (!socket || !socket.connected) {
            console.error('Socket is not connected');
            return;
        }
        myDataChannel = myPeerConnection.createDataChannel('communication');
        myDataChannel.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            const { type } = message;

            switch (type) {
                case MESSAGE_TYPES.METADATA:
                    handleStreamMetadata(message.streamType);
                    break;
                case MESSAGE_TYPES.CHAT:
                    addMessageToChat('상대방', message.content.content);
                    break;
                case MESSAGE_TYPES.SYSTEM:
                    addSystemMessageToChat(message.content.content);
                    break;
                default:
                    console.log('알 수 없는 메시지 유형:', type);
            }
        });

        console.log('made data channel');
        const offer = await myPeerConnection.createOffer();
        await myPeerConnection.setLocalDescription(offer);
        const roomId = targetRoomId;
        socket.emit('offer', { offer, roomId });
        console.log('1. offer 생성 -> 전송');
    } catch (error) {
        console.error('offer 생성 및 전송 중 에러 발생:', error);
    }
}
/**
 * 상대편에서 offer를 생성하여 보냈을 경우, 실행되는 함수
 * offer를 수신하여, 상대편의 정보를 인지함
 * answer를 생성하여 전송
 * 상대편에서 받은 datachannel도 연결함
 * @param {socket} socket 연결된 소켓
 */
async function receiveOfferMakeAnswer(socket) {
    try {
        socket.on('offer', async (offer) => {
            myPeerConnection.addEventListener('datachannel', (event) => {
                myDataChannel = event.channel;
                myDataChannel.addEventListener('message', (event) => {
                    const message = JSON.parse(event.data);
                    const { type } = message;

                    switch (type) {
                        case MESSAGE_TYPES.METADATA:
                            handleStreamMetadata(message.streamType);
                            break;
                        case MESSAGE_TYPES.CHAT:
                            addMessageToChat('상대방', message.content.content);
                            break;
                        case MESSAGE_TYPES.SYSTEM:
                            addSystemMessageToChat(message.content.content);
                            break;
                        default:
                            console.log('알 수 없는 메시지 유형:', type);
                    }
                });
            });
            console.log('2-1. offer 수신 ');
            await myPeerConnection.setRemoteDescription(offer);
            const answer = await myPeerConnection.createAnswer();
            await myPeerConnection.setLocalDescription(answer);
            console.log('2-2. answer 생성 및 전송 ');
            const roomId = targetRoomId;
            socket.emit('answer', { answer, roomId });
        });
    } catch (error) {
        console.error('offer 수신 및 answer 생성과 전송 중 에러 발생:', error);
    }
}
/**
 * 첫번째로 offer를 생성했던 쪽에서 answer를 받게되면 실행되는 함수
 * answer로 상대편의 정보를 인지
 * @param {socket} socket 연결된 소켓
 */
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

muteBtn.addEventListener('click', handleMuteClick);
/**
 *  마이크 끄기/켜기 버튼 클릭 시, 오디오 트랙 음소거/해제하는 함수
 */
function handleMuteClick() {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    updateMuteButton();
}

cameraBtn.addEventListener('click', handleCameraClick);
/**
 * 카메라 끄기/켜기 버튼 클릭 시, 비디오 트랙 활성화 및 비활성화하는 함수
 */
function handleCameraClick() {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    updateCameraButton();
}

sendBtn.addEventListener('click', handleSendClick);
/**
 * 보내기 버튼을 누르면, 상대방에게도 전달되고 나의 채팅창에도 표시되도록 함
 */
function handleSendClick() {
    const message = messageInput.value;
    if (message) {
        sendChatMessage(message);
        addMessageToChat('나', message);
        messageInput.value = '';
    }
}

/**
 * 채팅창에 보내는 사람과 메시지를 표시하는 함수
 * @param {string} sender 보내는 사람
 * @param {string} message 메시지
 */

function addMessageToChat(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (!isChatVisible) {
        chatToggle.classList.add('new-message');
    }
}

/**
 * 데이터 채널로 타입과 내용을 전송하는 함수
 * @param {MESSAGE_TYPES} type 메시지 타입
 * @param {string} content 내용
 */
function sendDataChannelMessage(type, content) {
    if (myDataChannel && myDataChannel.readyState === 'open') {
        const message = JSON.stringify({ type, content });
        myDataChannel.send(message);
        console.log(`메시지 전송: ${message}`);
    } else {
        console.log('데이터 채널이 열려 있지 않습니다.');
    }
}

/**
 *  스트림에 액션과, 어떤 스트림인지를 전송(웹캠 혹은 화면공유)
 * @param {MESSAGE_TYPES} actionType 웹캠 혹은 화면공유를 시작한다 혹은 중지한다
 */
function sendStreamMetadata(actionType) {
    sendDataChannelMessage(MESSAGE_TYPES.METADATA, { action: actionType });
}

/**
 * 메시지를 상대방에게 전달하는 함수
 * @param {string} message 메시지
 */
function sendChatMessage(message) {
    sendDataChannelMessage(MESSAGE_TYPES.CHAT, { content: message });
}

/**
 * 화면공유를 포함한 영상이 나오지 않도록 스트림을 중지처리하는 함수
 * @param {MideaStream} stream
 * @param {STREAM_TYPES} elementId myFace, peerFace, sharedScreen 중 하나
 * @param {ACTION_STREAM_TYPES} actionType stopScreenshare, stopPeerface 중 하나
 */
function stopStream(stream, elementId, actionType) {
    if (stream) {
        console.log('stopStream');
        console.log(stream);
        stream.getTracks().forEach((track) => track.stop());
        sendStreamMetadata(actionType);
        console.log(`${actionType} 중지`);
        document.getElementById(elementId).srcObject = null;
    }
}

/**
 * 데이터 채널로 받은 streamType에 따라 어떤 스트림을 보여주거나 중지해야할지 결정하는 함수
 * @param {ACTION_STREAM_TYPES} streamType
 */
function handleStreamMetadata(streamType) {
    console.log(streamType);
    switch (streamType) {
        case ACTION_STREAM_TYPES.PEERFACE:
            console.log('상대방이 웹캠 스트림을 전송 중입니다.');
            break;
        case ACTION_STREAM_TYPES.SCREENSHARE:
            console.log('상대방이 화면 공유 스트림을 전송 중입니다.');
            isPeerScreenSharing = true;
            updateShareScreenButton();
            break;
        case ACTION_STREAM_TYPES.STOP_PEERFACE:
            console.log('상대방이 웹캠 스트림을 중지했습니다.');
            peerFace.srcObject = null;
            break;
        case ACTION_STREAM_TYPES.STOP_SCREENSHARE:
            console.log('상대방이 화면 공유 스트림을 중지했습니다.');
            isPeerScreenSharing = false;
            sharedScreen.srcObject = null;
            updateVideoLayout();
            updateShareScreenButton();
            break;
        default:
            console.log('알 수 없는 메타데이터 액션:', streamType);
    }
}

shareScreenBtn.addEventListener('click', handleShareClick);
/**
 * 화면 공유 및 중지 버튼 클릭시 실행되는 함수
 */
async function handleShareClick() {
    if (!isScreenSharing) {
        await startScreenShare();
    } else {
        stopScreenShare();
    }
}

/**
 * 화면 공유 시작 함수
 */
async function startScreenShare() {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
        });
        console.log('screenStream');
        console.log(screenStream);
        screenStream.getTracks().forEach((track) => {
            myPeerConnection.addTrack(track, screenStream);
        });

        const sharedScreen = document.getElementById('sharedScreen');
        sharedScreen.srcObject = screenStream;
        sharedScreen.style.display = 'block';

        sendStreamMetadata(ACTION_STREAM_TYPES.SCREENSHARE);

        console.log('화면 공유 시작');
        updateScreenSharingStatus();

        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
            stopScreenShare();
        });
        updateVideoLayout();
    } catch (error) {
        console.error('화면 공유 오류 발생:', error);
    }
}

/**
 * 화면 공유 중지 함수
 */
function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        screenStream = null;
    }
    sendStreamMetadata(ACTION_STREAM_TYPES.STOP_SCREENSHARE);
    const senders = myPeerConnection.getSenders();
    senders.forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
            if (sender.track.label.includes('screen')) {
                myPeerConnection.removeTrack(sender);
            }
        }
    });
    updateVideoLayout();
    updateScreenSharingStatus();
    console.log('화면 공유 중지');
}
/**
 * 화면 공유 시, 버튼의 상태와 화면 공유 상태를 저장하는 변수 업데이트
 */
function updateScreenSharingStatus() {
    if (isScreenSharing) {
        isScreenSharing = false;
        shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
        sharedScreen.style.display = 'none';
    } else {
        isScreenSharing = true;
        shareScreenBtn.innerHTML = '<i class="fas fa-stop"></i>';
        sharedScreen.style.display = 'block';
    }
    updateVideoLayout();
    updateShareScreenButton();
}
function updateShareScreenButton() {
    if (isPeerScreenSharing) {
        shareScreenBtn.disabled = true;
        shareScreenBtn.style.opacity = '0.5';
        shareScreenBtn.title = '상대방이 화면을 공유 중입니다';
    } else {
        shareScreenBtn.disabled = false;
        shareScreenBtn.style.opacity = '1';
        shareScreenBtn.title = isScreenSharing
            ? '화면 공유 중지'
            : '화면 공유 시작';
    }
}
/**
 * 메타데이터(어떤 스트림에 어떤 액션을 취할지)를 데이터채널을 통해 전송하는 함수
 * @param {streamType} streamType peerface, screenshare, stopPeerface, stopScreenshare
 */
function sendStreamMetadata(streamType) {
    if (myDataChannel.readyState === 'open') {
        const metadata = JSON.stringify({ type: 'metadata', streamType });
        myDataChannel.send(metadata);
        console.log(`메타데이터 전송: ${metadata}`);
    } else {
        console.log('데이터 채널이 열려 있지 않습니다.');
    }
}
/**
 * 나가기 버튼을 눌렀을 때 실행되는 함수
 * @param {socket} socket 연결된 소켓
 */
async function handleLeaveRoom(socket) {
    console.log('방 나가기 시작');

    if (socket && socket.connected) {
        console.log('서버에 leaveRoom 이벤트 전송');
        socket.emit('leaveRoom', roomId);
    }
    await cleanupResources();

    socket.disconnect();
    console.log('방 나가기 완료');

    // 창 닫기
    window.close();

    // 브라우저가 window.close()를 차단할 경우를 대비한 대체 방법
    if (!window.closed) {
        alert('창을 닫을 수 없습니다. 수동으로 창을 닫아주세요.');
        window.location.href = '/'; // 메인 페이지로 리다이렉트
    }
}
async function cleanupResources(socket) {
    console.log('자원 정리 시작');

    // 모든 스트림의 트랙 중지
    function stopAllTracks(stream) {
        if (stream) {
            stream.getTracks().forEach((track) => {
                track.stop();
                console.log(`${track.kind} 트랙 중지됨`);
            });
        }
        const senders = myPeerConnection.getSenders();
        senders.forEach((sender) => {
            myPeerConnection.removeTrack(sender);
        });
    }

    stopAllTracks(myStream);
    stopAllTracks(screenStream);

    // 비디오 요소 초기화
    myFace.srcObject = null;
    peerFace.srcObject = null;
    sharedScreen.srcObject = null;

    // PeerConnection 정리
    if (myPeerConnection) {
        myPeerConnection.ontrack = null;
        myPeerConnection.onicecandidate = null;
        myPeerConnection.oniceconnectionstatechange = null;
        myPeerConnection.onsignalingstatechange = null;
        myPeerConnection.onicegatheringstatechange = null;
        myPeerConnection.onnegotiationneeded = null;

        // DataChannel 정리
        if (myDataChannel) {
            myDataChannel.close();
            myDataChannel = null;
        }

        // PeerConnection 종료
        myPeerConnection.close();
        myPeerConnection = null;
        console.log('PeerConnection 종료됨');
    }

    // 변수 초기화

    muted = false;
    cameraOff = false;

    updateScreenSharingStatus();

    cleanupChatBox();

    console.log('자원 정리 완료');
}
function showInitialScreen() {
    call.hidden = true;
    if (isScreenSharing) updateScreenSharingStatus();
    isPeerScreenSharing = false;
}

function cleanupChatBox() {
    chatBox.innerHTML = ''; // 모든 채팅 메시지 삭제
    console.log('채팅창이 초기화되었습니다.');
}

const chatContainer = document.getElementById('chatContainer');

let isChatVisible = false;

chatToggle.addEventListener('click', toggleChat);

function toggleChat() {
    console.log('DDDD');
    isChatVisible = !isChatVisible;
    chatContainer.style.display = isChatVisible ? 'block' : 'none';
    chatToggle.innerHTML = isChatVisible
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-comments"></i>';

    if (isChatVisible) {
        chatBox.scrollTop = chatBox.scrollHeight;
        chatToggle.classList.remove('new-message');
    }
}
function updateVideoLayout() {
    if (isScreenSharing || isPeerScreenSharing) {
        videoContainer.classList.add('screen-share-active');
        sharedScreen.style.display = 'block';

        myFace.style.left = '20px';
        myFace.style.bottom = '20px';
        myFace.style.top = 'auto';
        myFace.style.right = 'auto';

        peerFace.style.right = '20px';
        peerFace.style.bottom = '20px';
        peerFace.style.top = 'auto';
        peerFace.style.left = 'auto';

        makeDraggable(myFace);
        makeDraggable(peerFace);
    } else {
        videoContainer.classList.remove('screen-share-active');
        sharedScreen.style.display = 'none';

        myFace.style = '';
        peerFace.style = '';

        removeDraggable(myFace);
        removeDraggable(peerFace);
    }
}
function makeDraggable(element) {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;

        // 비디오 컨테이너 경계 내에서만 이동하도록 제한
        const container = videoContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        if (newTop >= 0 && newTop + elementRect.height <= container.height) {
            element.style.top = newTop + 'px';
            element.style.bottom = 'auto';
        }
        if (newLeft >= 0 && newLeft + elementRect.width <= container.width) {
            element.style.left = newLeft + 'px';
            element.style.right = 'auto';
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function removeDraggable(element) {
    element.onmousedown = null;
}
