import express from 'express';
import { getConsultingRoom } from '../controllers/consultingController.js'; // .js 확장자 포함

const router = express.Router();

router.post('/api/consulting-room/:roomId', getConsultingRoom);

export default router;
