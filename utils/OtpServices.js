import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import OTP from "../models/Otp.js"; 
import { EMAIL_PASS, EMAIL_USER } from "../config/env.js";
dotenv.config();



// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Generate a secure 6-digit OTP
export const generateOtp = () => {
  const buffer = crypto.randomBytes(3); 
  return parseInt(buffer.toString('hex'), 16) % 1000000; 
};

// Request OTP while login if forget password Route
export const requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  const otp = generateOtp().toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; 
  try {
    await OTP.create({ email, otp, expiresAt });
  } catch (error) {
    console.error("Error saving OTP:", error);
    return res.status(500).json({ message: "Failed to save OTP. Please try again later." });
  }

  // Send OTP via email
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Your OTP for Password Reset",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again later." });
  }
};

// Validate OTP Route
export const validateOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  try {
    const storedOtpData = await OTP.findOne({ email }).sort({ expiresAt: -1 });

    if (!storedOtpData) {
      return res.status(400).json({
        message: "No OTP found for this email. Please request a new one.",
      });
    }

    const { otp: storedOtp, expiresAt } = storedOtpData;

    if (Date.now() > expiresAt) {
      await OTP.deleteOne({ email }); 
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Validate OTP
    if (otp !== storedOtp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // OTP is valid
    await OTP.deleteOne({ email }); 
    res.status(200).json({ message: "OTP validated successfully" });
  } catch (error) {
    console.error("Error validating OTP:", error);
    res.status(500).json({ message: "Error validating OTP. Please try again later." });
  }
};

// Send OTP for sign up  Route
export const sendOtpforSignup = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists with this email" });
  }

  const otp = generateOtp().toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

  // Store OTP in the database
  try {
    await OTP.create({ email, otp, expiresAt });
  } catch (error) {
    console.error("Error saving OTP:", error);
    return res.status(500).json({ message: "Failed to save OTP. Please try again later." });
  }

  // Send OTP via email
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: "Your OTP for Login",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again later." });
  }
};