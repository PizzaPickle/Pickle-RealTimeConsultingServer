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

async function redisTest() {
  console.log('redisTest');
}

export { redisTest };
