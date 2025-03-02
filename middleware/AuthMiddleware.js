import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../config/env.js';

export const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded;  
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    res.status(401).json({ message: "Invalid token." });
  }
};
