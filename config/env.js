import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const OTP_EXPIRY = process.env.OTP_EXPIRY || 5; // Default to 5 minutes if not set
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const SECRET_KEY = process.env.SECRET_KEY;

export const GEMINI_API_KEY=process.env.GEMINI_API_KEY
