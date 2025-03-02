
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    technology: { type: [String], required: true }, // Tech categories like JavaScript, Linux
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String }, // Storing username for frontend display
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    maxParticipants: { type: Number, default: 30, min: 1, max: 100 },
    isPrivate: { type: Boolean, default: false }, // Private rooms need invite
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Allowed in private rooms
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Room owner
    miniAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users with moderator privileges
    isActive: { type: Boolean, default: true }, // Check if room is live
    lastParticipantLeftAt: { type: Date, default: null }, // Track last leave time
  },
  { timestamps: true }
);


// Check if the room is full
roomSchema.methods.isFull = function () {
  return this.participants.length >= this.maxParticipants;
};

// Add Participant Method (with username)
roomSchema.methods.addParticipant = async function (user) {
  if (!user || !user._id) {
    throw new Error("Invalid user object. User or user._id is undefined.");
  }

  console.log("Adding participant:", user); // Debugging

  if (this.isFull()) throw new Error("Room is full, cannot add more participants.");

  const userIdStr = user._id.toString();

  if (this.participants.some((p) => p.userId?.toString() === userIdStr)) {
    throw new Error("User is already in the room.");
  }

  if (this.isPrivate && !this.allowedUsers.some((u) => u?.toString() === userIdStr)) {
    throw new Error("User not authorized to join this private room.");
  }

  this.participants.push({ userId: user._id, username: user.fullname }); // Storing userId and username
  await this.save();
};

const Room = mongoose.model("Room", roomSchema);
export default Room;
