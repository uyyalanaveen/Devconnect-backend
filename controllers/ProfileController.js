import cloudinary from '../config/cloudinary.js'; // Cloudinary config
import User from '../models/User.js'; // User model
import fs from 'fs'; // To remove file after uploading to Cloudinary



export const updateUserProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Find existing user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profileImageUrl = user.profileImage; // Keep existing image if no new one is uploaded

    // If a new file is uploaded
    if (req.file) {
      // Remove the previous image from Cloudinary (optional)
      if (user.profileImage) {
        const publicId = user.profileImage.split('/').pop().split('.')[0]; // Extract public_id
        await cloudinary.uploader.destroy(`uploads/profileImages/${publicId}`);
      }

      // Upload the new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "uploads/profileImages",
        use_filename: true,
        unique_filename: false,
      });

      // Get the new image URL
      profileImageUrl = result.secure_url;

      // Remove the uploaded file from the server
      fs.unlinkSync(req.file.path);
    }

    // Update user's profile, including bio
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname: req.body.fullname || user.fullname,
        techStack: req.body.techStack ? JSON.parse(req.body.techStack) : user.techStack,
        bio: req.body.bio || user.bio, // Add bio field update
        profileImage: profileImageUrl,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};


// 📌 Add a Follower
export const followUser = async (req, res) => {
    try {
        const userId = req.user.userId; // Logged-in user
        const { followId } = req.body; // User to follow

        // Prevent self-following
        if (userId === followId) {
            return res.status(400).json({ message: "You cannot follow yourself." });
        }

        const userToFollow = await User.findById(followId);
        const currentUser = await User.findById(userId);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if already following
        if (currentUser.following.includes(followId)) {
            return res.status(400).json({ message: "You are already following this user." });
        }

        // Add follower & following
        currentUser.following.push(followId);
        userToFollow.followers.push(userId);

        await currentUser.save();
        await userToFollow.save();

        res.status(200).json({ message: "User followed successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error following user", error: error.message });
    }
};

// 📌 Remove a Follower
export const unfollowUser = async (req, res) => {
    try {
        const userId = req.user.userId; // Logged-in user
        const { unfollowId } = req.body; // User to unfollow

        const userToUnfollow = await User.findById(unfollowId);
        const currentUser = await User.findById(userId);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if the user is actually following
        if (!currentUser.following.includes(unfollowId)) {
            return res.status(400).json({ message: "You are not following this user." });
        }

        // Remove follower & following
        currentUser.following = currentUser.following.filter(id => id.toString() !== unfollowId);
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== userId);

        await currentUser.save();
        await userToUnfollow.save();

        res.status(200).json({ message: "User unfollowed successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error unfollowing user", error: error.message });
    }
};
