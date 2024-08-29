import { createClient } from 'redis';

const redisClient = createClient({
  port: 6379,
  host: '127.0.0.1',
});

redisClient.on('error', (err) => {
  console.error('Redis 오류:', err);
});

async function connectRedis() {
  console.log('Redis에 연결되었습니다.');
  await redisClient.connect();
}

connectRedis().catch(console.error);

async function getRoomList(userId) {
  try {
    const roomList = [];
    const keys = await redisClient.keys('room:*');

    for (const key of keys) {
      const customerId = await redisClient.hGet(key, 'customerId');
      const pbId = await redisClient.hGet(key, 'pbId');

      if (userId === customerId || userId === pbId) {
        roomList.push(await redisClient.hGetAll(key));
        console.log('같음');
      }
    }

    return roomList;
  } catch (error) {
    console.error('데이터 조회 오류:', error);
  }
}

export { getRoomList };
