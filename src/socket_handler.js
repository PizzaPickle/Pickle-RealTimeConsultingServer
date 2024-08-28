import SocketIO from 'socket.io';
import { redisTest } from './redis_client';
function socketHandler(server) {
  console.log('소켓 핸들러 함수 시작');
  const wsServer = SocketIO(server);
  wsServer.on('connection', (socket) => {
    console.log('소켓 연결됨');
    handleRedisTest();
    socket.on('disconnecting', (socket) => {
      performDisconnectingTask(socket)
        .then(() => {
          console.log('연결 해제 작업 완료');
        })
        .catch((error) => {
          console.error('비동기 작업 중 오류 발생:', error);
        });
    });

    socket.on('disconnect', (socket) => {
      console.log('소켓 연결 해제');
    });
  });
}

async function performDisconnectingTask(socket) {
  return new Promise((resolve, reject) => {
    console.log('소켓 연결 해제 전 필요한 작업을 처리하는 함수');
    resolve();
  });
}

async function handleRedisTest() {
  try {
    await redisTest();
    console.log('Redis 테스트 완료');
  } catch (error) {
    console.error('Redis 테스트 중 오류 발생:', error);
  }
}

export default socketHandler;
