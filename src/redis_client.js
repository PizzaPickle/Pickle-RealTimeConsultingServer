import { createClient } from 'redis';
import ENV from './config.js';

const redisClient = createClient({
    port: ENV.REDIS_PORT,
    host: ENV.REDIS_HOST,
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
        const roomList = []; // 빈 배열로 초기화
        const keys = await redisClient.keys('room:*'); // Redis에서 모든 키 가져오기

        for (const key of keys) {
            const customerId = await redisClient.hGet(key, 'customerId');
            const pbId = await redisClient.hGet(key, 'pbId');
            // 고객 ID 또는 PB ID가 사용자 ID와 일치하는 경우만 필터링
            if (userId === customerId || userId === pbId) {
                const roomData = await redisClient.hGetAll(key);
                roomList.push({
                    consultingHistoryId: roomData.consultingHistoryId,
                    roomId: roomData.roomId,
                    date: roomData.date,
                    customerId: roomData.customerId,
                    customerName: roomData.customerName,
                    pbId: roomData.pbId,
                    pbName: roomData.pbName,
                    pbImage: roomData.pbImage,
                    pbBranchOffice: roomData.pbBranchOffice,
                });
            }
        }

        console.log('Fetched room list:', roomList); // 디버깅용 출력
        return roomList;
    } catch (error) {
        console.error('데이터 조회 오류:', error);
        return [];
    }
}

async function saveConsultingRoomInfo({ roomId, roomInfo }) {
    try {
        console.log(roomInfo);
        await redisClient.hSet(
            `room:${roomId}`,
            ...Object.entries(roomInfo).flat()
        );
        console.log(
            `room:${roomId}(${roomInfo.customerName}&${roomInfo.pbName})에 대한 정보가 성공적으로 저장됨`
        );
    } catch (error) {
        console.error('상담룸정보 저장 중 오류 발생: ', error);
    }
}

async function deleteExpiredRooms() {
    try {
        const currentTime = Date.now();
        const roomIds = await redisClient.keys('room:*');

        for (const roomId of roomIds) {
            const roomInfo = await redisClient.hGetAll(roomId);

            if (roomInfo.date) {
                const roomTime = new Date(roomInfo.date).getTime();

                if (currentTime - roomTime >= 60 * 60 * 1000) {
                    await redisClient.del(roomId);
                    console.log(
                        `상담룸(room:${roomId})에 대한 정보 삭제(1시간 지남)`
                    );
                }
            }
        }
    } catch (error) {
        console.error('만료된 상담 방 정보 삭제 중 오류 발생: ', error);
    }
}

async function getConsultingRoomInfo(roomId) {
    try {
        const roomInfo = await redisClient.hGetAll(`room:${roomId}`);
        return roomInfo;
    } catch (error) {
        console.log(`room:${roomId} 정보 조회 중 오류 발생: `, error);
    }
}
setInterval(deleteExpiredRooms, 30 * 60 * 1000);
export { getRoomList, saveConsultingRoomInfo, getConsultingRoomInfo };
