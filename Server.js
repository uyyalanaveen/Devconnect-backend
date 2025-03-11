import express from "express";
import http from "http";
import cors from "cors";
import connectDb from "./config/db.js";
import { PORT } from "./config/env.js";
import { GEMINI_API_KEY } from "./config/env.js";
import roomRouter from "./routes/RoomRoutes.js";
import userRouter from "./routes/Userroutes.js";
import cron from "node-cron";
import Room from "./models/Room.js";
import setupSignaling from "./signaling.js";
import User from "./models/User.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const server = http.createServer(app);
const io = setupSignaling(server,Room, User);
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://dev-connect-1.vercel.app",
      "http://192.168.29.189:5173",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cron.schedule("*/5 * * * *", async () => {
  console.log("🔍 Checking for inactive rooms...");
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  try {
    const expiredRooms = await Room.find({
      participants: { $size: 0 },
      lastParticipantLeftAt: { $lt: tenMinutesAgo },
    });

    if (expiredRooms.length) {
      console.log(`🗑️ Deleting ${expiredRooms.length} expired rooms...`);
      await Room.deleteMany({ _id: { $in: expiredRooms.map((room) => room._id) } });
    }
  } catch (error) {
    console.error("❌ Error deleting rooms:", error.message);
  }
});


// 🔹 Routes
app.use("/api", userRouter);
app.use("/api", roomRouter);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
app.post("/chat", async (req, res) => {
  const chatHistory = req.body.history || [];
  const msg = req.body.chat;
  const chat = model.startChat({
      history: chatHistory
  });

  const result = await chat.sendMessage(msg);
  const response = await result.response;
  const text = response.text();
  res.send({"text":text});
});


app.post("/stream", async (req, res) => {
  const chatHistory = req.body.history || [];
  const msg = req.body.chat;

  const chat = model.startChat({
    history: chatHistory
  });

  const result = await chat.sendMessageStream(msg);
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    res.write(chunkText);
  }
  res.end();
});


app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong" });
});

// 🔹 Process error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

try {
  connectDb();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("❌ Error starting server:", error);
  process.exit(1);
}
