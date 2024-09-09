import express from "express";
import {
  getConsultingRoom,
  getRoomList,
} from "../controllers/consultingController.js"; // .js 확장자 포함

const router = express.Router();

router.get("/consulting-room", getRoomList);
router.post("/consulting-room/:roomId", getConsultingRoom);

export default router;
