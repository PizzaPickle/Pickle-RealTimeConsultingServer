const myFace = document.getElementById('myFace');
const sharedScreen = document.getElementById('sharedScreen');
const peerFace = document.getElementById('peerFace');

const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const shareScreenBtn = document.getElementById('shareScreen');

const camerasSelect = document.getElementById('cameras');

let myStream;
let screenStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;
let targetRoomId;
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
	targetRoomId = roomId;
	const socket = io();
	console.log(socket);
	socket.emit('joinConsultingRoom', roomId);
	socket.on('consultingRoomInfo', (roomInfo) => {
		initCall();
	});
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
		myFace.srcObject = myStream;
		if (!deviceId) {
			await getCameras();
		}
	} catch (error) {
		console.log(error);
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
	} catch (error) {
		console.log(error);
	}
}
