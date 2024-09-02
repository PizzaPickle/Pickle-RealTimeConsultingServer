import SocketIO from 'socket.io';
import { getRoomList, getConsultingRoomInfo } from './redis_client';

function socketHandler(server) {
	console.log('소켓 핸들러 함수 시작');

	const wsServer = SocketIO(server);

	wsServer.on('connection', (socket) => {
		console.log('소켓 연결됨');

		socket.on('requestRoomList', async ({ userId }) => {
			try {
				const roomList = await getRoomList(userId);
				socket.emit('receiveRoomList', roomList);

				socket.disconnect(true);
			} catch (error) {
				console.error('RoomList 조회 중 에러 발생:', error);
			}
		});

		socket.on('joinConsultingRoom', async (roomId) => {
			try {
				socket.join(roomId);

				const roomInfo = await getConsultingRoomInfo(roomId);
				socket.emit('consultingRoomInfo', roomInfo);

				socket.to(roomId).emit('newUserJoined', { message: '입장했습니다.' });
			} catch (error) {
				console.error('ConsultingRoom 입장 불가', error);
			}
		});

		socket.on('offer', (offer, roomId) => {
			socket.to(roomId).emit('offer', offer);
		});
		socket.on('answer', (answer, roomId) => {
			socket.to(roomId).emit('answer', answer);
		});
		socket.on('ice', (ice, roomId) => {
			socket.to(roomId).emit('ice', ice);
		});
		socket.on('disconnecting', () => {
			const rooms = Array.from(socket.rooms);
			rooms.forEach((roomId) => {
				performDisconnectingTask(socket, roomId)
					.then(() => {
						console.log('연결 해제 작업 완료');
					})
					.catch((error) => {
						console.error('비동기 작업 중 오류 발생:', error);
					});
			});
		});

		socket.on('disconnect', (socket) => {
			console.log('소켓 연결 해제');
		});
		socket.on('leaveRoom', (targetRoomId) => {
			socket.leave(targetRoomId);
			socket.to(targetRoomId).emit('peerDisconnecting');
		});
	});
}

async function performDisconnectingTask(socket, targetRoomId) {
	return new Promise((resolve, reject) => {
		console.log('소켓 연결 해제 전 필요한 작업을 처리하는 함수');
		resolve();
	});
}

export default socketHandler;
