import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { SECRET_KEY } from '../config/env.js';
import mongoose from 'mongoose';


/**
 * Register a new user
 */
export const addUser = async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      SECRET_KEY,
      // { expiresIn: "7d" } // Valid expiry (7 days)
    );
    console.log(token)    
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error creating user:", error); // Log full error
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
  
};

// get all users

export const AllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords
    
    // Process the users array to handle profile image URLs
    const processedUsers = users.map(user => ({
      ...user.toObject(),
      profileImage: user.profileImage?.startsWith('http')
        ? user.profileImage // If already a full URL
        : `${req.protocol}://${req.get("host")}/${user.profileImage}` // For local storage
    }));

    res.status(200).json({ success: true, users: processedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error });
  }
};


/**
 * Check if email exists
 */
export const checkEmail = async (req,res) =>{
    const { email } = req.body;

    if(!email)
    {
        return res.status(400).json({ 
            success: false,
            message: "Email is required",
        });
    }

    try {
        const user = await User.findOne({email});
        if(!user)
        {
            return res.status(400).json({
                success:false,
                message:"Email  Not Found"
            })
        }

        res.status(200).json({ 
            success: true,
            message: "Email exists",
            data: {
              email: user.email,
            },
          });
        
    } catch (error) {
        console.log("error checking email: ",error);
        res.status(500).json({
            success : false,
            message : "Server Error. Please Try Again"
        })
    }
}
/**
 * Get logged-in user
 */
export const getUser = async (req, res) => {
  try {
    console.log("Decoded User:", req.user);

    if (!req.user?.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId).select("-password").lean();

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found, please log in" });
    }

    if (user.profileImage) {
      user.profileImage = user.profileImage.startsWith('http')
        ? user.profileImage
        : `${req.protocol}://${req.get("host")}/${user.profileImage}`;
    }

    res.status(200).json({
      status: true,
      message: "User Found",
      data: { user },
    });

  } catch (error) {
    console.error("Error in getUser:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(id)
      .select("-password") // Exclude password
      .populate("followers", "fullname profileImage") // Populate followers with specific fields
      .populate("following", "fullname profileImage"); // Populate following with specific fields

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileImage = user.profileImage.startsWith("http")
      ? user.profileImage
      : `${req.protocol}://${req.get("host")}/${user.profileImage}`;

    res.status(200).json({
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      profileImage,
      followers: user.followers, // Now populated with user details
      following: user.following, // Now populated with user details
      techStack: user.techStack || [], // Ensure it always returns an array
      bio: user.bio || "", // Ensure bio is always returned
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};


/**
 * Login user
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      SECRET_KEY,
      // { expiresIn: null }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error); // Log full error
    res.status(500).json({ message: "Error during login", error: error.toString() });
  }
  
};

/**
 * Update password
 */
export const setNewPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update password", error: err.message });
  }
};