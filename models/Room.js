import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    password: { type: String, select: true }, // Secure password field
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Allowed in private rooms
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Room owner
    miniAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users with moderator privileges
    isActive: { type: Boolean, default: true }, // Check if room is live
    lastParticipantLeftAt: { type: Date, default: null }, // Track last leave time
  },
  { timestamps: true }
);

// Hash password before saving
roomSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Check if the room is full
roomSchema.methods.isFull = function () {
  return this.participants.length >= this.maxParticipants;
};

// Add Participant Method (with password check for private rooms)
roomSchema.methods.addParticipant = async function (user, providedPassword = null) {
  if (!user || !user._id) {
    throw new Error("Invalid user object. User or user._id is undefined.");
  }

  if (this.isFull()) throw new Error("Room is full, cannot add more participants.");

  const userIdStr = user._id.toString();
  if (this.participants.some((p) => p.userId?.toString() === userIdStr)) {
    throw new Error("User is already in the room.");
  }

  // Private room access control
  if (this.isPrivate && !this.allowedUsers.some((id) => id.toString() === userIdStr)) {
    if (!providedPassword) {
      throw new Error("Password is required to join this private room.");
    }

    // Fetch the password (since select: false)
    const roomWithPassword = await mongoose.model("Room").findById(this._id).select("password");
    const isMatch = await bcrypt.compare(providedPassword, roomWithPassword.password);
    if (!isMatch) {
      throw new Error("Incorrect password.");
    }
  }

  this.participants.push({ userId: user._id, username: user.fullname });
  await this.save();
};

// Grant user access without a password
roomSchema.methods.allowUser = async function (userId) {
  if (!this.allowedUsers.includes(userId)) {
    this.allowedUsers.push(userId);
    await this.save();
  }
};

const Room = mongoose.model("Room", roomSchema);
export default Room;
