const pickleUserInput = document.getElementById('pickleUserInput');

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
let roomName;
let myPeerConnection;

window.addEventListener('beforeunload', () => {
  console.log('페이지 떠남, 소켓 연결 해제');
  socket.disconnect();
});

// roomList 가져오기
const showRoomListBtn = document.getElementById('showRoomList');
showRoomListBtn.addEventListener('click', showRoomList);
function showRoomList() {
  const userId = document.getElementById('pickleUserInput').value;
  const socket = io();
  console.log(userId);
}
