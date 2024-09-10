import express from 'express';
import {
    getConsultingRoom,
    getRoomList,
    getConsultingRoomByPost,
} from '../controllers/consultingController.js'; // .js 확장자 포함

const router = express.Router();

router.get('/consulting', getRoomList);
router.get('/consulting/:roomId', getConsultingRoom);
router.post('/consulting/:roomId', getConsultingRoomByPost);

export default router;
