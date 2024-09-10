import { getRoomList as getRoomListFromRedis } from '../redis_client.js';
export function getConsultingRoom(req, res) {
    const { roomId } = req.params;
    const { userName, userId } = req.query;

    if (!roomId || !userName || !userId) {
        return res.status(400).json({ message: '모든 필드가 필요합니다.' });
    }

    console.log(roomId, userName, userId);

    try {
        res.render('session', { roomId, userName, userId });
    } catch (error) {
        console.error('View 렌더링 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
}

export async function getRoomList(req, res) {
    try {
        const { userId } = req.query;
        console.log('Requested User ID:', userId);

        const roomList = await getRoomListFromRedis(userId);
        console.log('Fetched room list from Redis:', roomList);

        if (!roomList) {
            return res.status(404).json({ error: 'Room list not found' });
        }

        res.json(roomList);
    } catch (error) {
        console.error('Error fetching room list:', error);
        res.status(500).json({ error: 'Failed to fetch room list' });
    }
}
