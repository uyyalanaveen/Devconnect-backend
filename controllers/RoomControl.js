import Room from "../models/Room.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new room
 * @route   POST /api/create-room
 * @access  Private
 */
export const createRoom = async (req, res) => {
  try {
    const { name, description, technology, maxParticipants, isPrivate } = req.body;
    if (!name || !technology || maxParticipants === undefined) {
      return res.status(400).json({ message: "Name, technology, and maxParticipants are required." });
    }
    const newRoom = new Room({
      name,
      description,
      technology,
      maxParticipants,
      isPrivate,
      allowedUsers: isPrivate ? req.body.allowedUsers || [] : [],
      createdBy: req.user.userId,
      participants: [],
    });

    await newRoom.save();

    const populatedRoom = await Room.findById(newRoom._id)
      .populate("createdBy", "fullname email")
      .populate("participants", "fullname email");

    return res.status(201).json({ message: "Room created successfully", room: populatedRoom });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Join a room
 * @route   POST /api/join-room/:id
 * @access  Private
 */
export const joinRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id: newRoomId } = req.params;
    const userId = req.user?.userId; // Extract user ID from request

    if (!userId) throw new Error("User ID is missing or invalid.");

    // ✅ Check if the new room exists
    const newRoom = await Room.findById(newRoomId).session(session);
    if (!newRoom) throw new Error("Room not found.");

    // ✅ Check if the user exists
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found.");

    // ✅ Check if the user is already in a different room & remove them
    const currentRoom = await Room.findOne({ "participants.userId": userId }).session(session);
    if (currentRoom) {
      currentRoom.participants = currentRoom.participants.filter((p) => p.userId.toString() !== userId);
      await currentRoom.save({ session });

      // Remove the room from the user's joined rooms
      await User.findByIdAndUpdate(userId, { $pull: { rooms: currentRoom._id } }, { session });
    }

    // ✅ Add the user to the new room (prevent duplicates)
    const alreadyJoined = newRoom.participants.some((p) => p.userId.toString() === userId);
    if (!alreadyJoined) {
      newRoom.participants.push({ userId });
      await newRoom.save({ session });
    }

    // ✅ Update the user's room list
    await User.findByIdAndUpdate(userId, { $addToSet: { rooms: newRoomId } }, { session });

    // ✅ Fetch updated room details (inside session)
    const updatedRoom = await Room.findById(newRoomId)
      .session(session)
      .populate("participants.userId", "fullname profileImage")
      .populate("createdBy", "fullname email");

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Successfully joined the room.", room: updatedRoom });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error joining room:", error);
    res.status(400).json({ message: error.message });
  }
};
export const getRoomById = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const room = await Room.findById(roomId)
      .populate("participants.userId", "fullname profileImage")
      .select("name participants");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get all rooms
 * @route   GET /api/rooms
 * @access  Public
 */
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("participants.userId", "fullname email")
      .populate("createdBy", "fullname email");

    if (rooms.length === 0) {
      return res.status(404).json({ message: "No rooms found." });
    }
    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return res.status(500).json({ message: "Failed to fetch rooms.", error: error.message });
  }
};

/**
 * @desc    Leave a room
 * @route   POST /api/leave-room/:roomId
 * @access  Private
 */
export const leaveRoom = async (req, res) => {
  try {
    console.log("Request Headers:", req.headers);
    console.log("Request User:", req.user);

    const { id: roomId } = req.params;
    const userId = req.user?.userId;  // 🔴 Possible issue

    if (!roomId || !userId) {
      return res.status(400).json({ message: "Room ID and User ID are required." });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    const userIdStr = userId.toString();
    const updatedParticipants = room.participants.filter((p) => p.userId && p.userId.toString() !== userIdStr);

    if (updatedParticipants.length === room.participants.length) {
      return res.status(400).json({ message: "User is not in this room." });
    }

    room.participants = updatedParticipants;

    if (room.participants.length === 0) {
      room.lastParticipantLeftAt = new Date();
    }

    await room.save();
    return res.status(200).json({ message: "User left the room successfully." });
  } catch (error) {
    console.error("Error leaving room:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

