import express from 'express';
import { createRoom, getAllRooms, getRoomById, joinRoom, leaveRoom } from "../controllers/RoomControl.js";
import { authenticateUser } from '../middleware/AuthMiddleware.js'; // Assuming you've set up auth middleware
const roomRouter = express.Router();

roomRouter.post('/create-room', authenticateUser, createRoom);
roomRouter.get('/get-room/:id',authenticateUser,getRoomById);
roomRouter.get('/get-rooms', authenticateUser, getAllRooms);
roomRouter.post('/room/:id',authenticateUser,joinRoom)
roomRouter.delete('/room/leave-room/:id',authenticateUser,leaveRoom)

export default roomRouter;
