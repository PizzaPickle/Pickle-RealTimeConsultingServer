// socketHandlers.js
import { enterRoom } from './functions';
export function setupSocketDisconnectionHandlers(socket) {
    window.onbeforeunload = () => {
        socket.disconnect();
    };

    window.onpopstate = () => {
        socket.disconnect();
    };
}

export function handleSocketError(socket, defaultMessage = '예기치 않은 소켓 에러 발생') {
    socket.on('error', (message) => {
        const errorMessage = message || defaultMessage;
        console.error('Error:', errorMessage);
        alert(errorMessage);
        socket.disconnect(true);
    });
}

export function getUserInfo() {
    const userId = document.getElementById('userIdInput').value;
    if (userId.startsWith('p')) userType = 'PB';
    if (userId) {
        const socket = io();

        setupSocketDisconnectionHandlers(socket);
        handleSocketError(socket);
        socket.emit('requestRoomList', { userId: userId });

        socket.on('roomList', (roomList) => {
            displayRoomList(roomList);
            socket.disconnect();
        });
    } else {
        alert('유효한 고객 ID를 입력해주세요.');
    }
}

export function displayRoomList(roomList) {
    const profileListContainer = document.getElementById('profileList');
    profileListContainer.innerHTML = '';

    if (roomList.length > 0) {
        roomList.forEach((roomInfo) => {
            const profileCard = document.createElement('div');
            profileCard.classList.add('profile');

            const strArr = roomInfo.dateInfo.split('-');
            const consultationDate = new Date(strArr[0], strArr[1] - 1, strArr[2], roomInfo.timeInfo.split(':')[0]);
            const now = new Date();
            const isAvailable = consultationDate <= now;

            profileCard.innerHTML = `
              <div>
                  ${roomInfo.pbInfo.image ? `<img src="${roomInfo.pbInfo.image}" alt="PB 이미지" />` : ''}
                  <div>
                      <h2>${roomInfo.pbInfo.name}</h2>
                      ${roomInfo.pbInfo.branch_office ? `<p> ${roomInfo.pbInfo.branch_office} </p>` : ''}
                      <p> ${roomInfo.dateInfo} ${roomInfo.timeInfo}</p>
                  </div>
              </div>
              <div class="actions">
                  <button ${isAvailable ? '' : 'disabled'} onclick="enterRoom('${roomInfo.roomId}')">입장하기</button>
              </div>
          `;

            profileListContainer.appendChild(profileCard);
        });
    } else {
        alert('참여 가능한 방이 없습니다.');
    }
}
