import { getRoomList as getRoomListFromRedis } from '../redis_client.js';
export function getConsultingRoom(req, res) {
  const { roomId } = req.params;
  const { userName, userId } = req.body;

  if (!roomId || !userName || !userId) {
    return res.status(400).json({ message: '모든 필드가 필요합니다.' });
  }

  console.log(roomId, userName, userId);
  res.render('consultingRoom', { roomId, userName, userId });
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

    res.json(roomList); // JSON 형식으로 응답 전송
  } catch (error) {
    console.error('Error fetching room list:', error);
    res.status(500).json({ error: 'Failed to fetch room list' });
  }
}
