import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "https://res.cloudinary.com/dbpgevghy/image/upload/v1739248882/DevConnect-Profiles/default-profile_wg8arj.png" },
    techStack: [{ type: [String], default: [] }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    bio: { type: String, default: "" } // Added bio field
});

const User = mongoose.model("User", UserSchema);
export default User;
