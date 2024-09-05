export function getConsultingRoom(req, res) {
	const { roomId } = req.params;
	const { userName, userId } = req.body;

	if (!roomId || !userName || !userId) {
		return res.status(400).json({ message: '모든 필드가 필요합니다.' });
	}

	console.log(roomId, userName, userId);
	res.render('consultingRoom', { roomId, userName, userId });
}
