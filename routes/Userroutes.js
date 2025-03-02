import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  addUser,
  getUser,
  loginUser,
  setNewPassword,
  checkEmail,
  getUserById,
  AllUsers,
} from '../controllers/AuthUsers.js';
import { validateOtp,sendOtpforSignup,requestOtp } from '../utils/OtpServices.js';
import {followUser, unfollowUser, updateUserProfile,} from '../controllers/ProfileController.js'
import { authenticateUser } from '../middleware/AuthMiddleware.js';
import upload from '../middleware/multerConfig.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 🔹 Register User
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  ],
  handleValidationErrors,
  addUser
);

// 🔹 Get logged-in user
router.get('/users/me', authenticateUser, getUser);

// 🔹 Get user by ID
router.get('/users/:id', getUserById);
// all users

router.get('/userslist',AllUsers);

// 🔹 Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  ],
  handleValidationErrors,
  loginUser
);

// 🔹 Password Reset
router.put(
  '/set-new-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  ],
  handleValidationErrors,
  setNewPassword
);

// 🔹 Check if Email Exists
router.post('/check-email', checkEmail);

// Otp routes
router.post('/request-otp',requestOtp);
router.post('/validate-otp',validateOtp);
router.post('/request-otp-login',sendOtpforSignup);



// 🔹 Update user profile
router.put('/users/me/update-profile', upload.single('profileImage') ,authenticateUser, updateUserProfile);
router.post('/users/add-friend',authenticateUser,followUser);
router.delete('/users/remove-friend',authenticateUser,unfollowUser);
export default router;
