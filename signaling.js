// import { Server } from "socket.io";
// import mongoose from "mongoose";


// const setupSignaling = (server, Room, User) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//     },
//   });

//   // Store active connections by room
//   const rooms = {};
//   // Map socket IDs to user IDs for tracking
//   const socketToUserMap = new Map();

//   io.on("connection", async (socket) => {
//     console.log("🔗 New user connected:", socket.id);

//     // Get user ID from socket authentication
//     const userId = socket.handshake.auth.userId;
//     if (userId) {
//       socketToUserMap.set(socket.id, userId);
//     } else {
//       console.warn("Socket connected without user ID:", socket.id);
//     }

//     // 🔹 User joins a room
//     socket.on("join-room", async (roomId) => {
//       try {
//         // Get the user ID for this socket
//         const userId = socketToUserMap.get(socket.id);
//         if (!userId) {
//           console.error("No user ID found for socket:", socket.id);
//           socket.emit("error", { message: "Authentication required" });
//           return;
//         }

//         // Find the user to get their data
//         const user = await User.findById(userId);
//         if (!user) {
//           console.error("User not found:", userId);
//           socket.emit("error", { message: "User not found" });
//           return;
//         }

//         // Find the room
//         const room = await Room.findById(roomId);
//         if (!room) {
//           console.error("Room not found:", roomId);
//           socket.emit("error", { message: "Room not found" });
//           return;
//         }

//         // Add user to room using the schema method
//         try {
//           await room.addParticipant(user);
//           console.log(`User ${user.fullname} joined room ${room.name}`);
//         } catch (err) {
//           console.error("Error adding participant:", err.message);
//           socket.emit("error", { message: err.message });
//           return;
//         }

//         // Track socket connection in memory for WebRTC signaling
//         if (!rooms[roomId]) rooms[roomId] = [];
//         rooms[roomId].push(socket.id);
//         socket.join(roomId);

//         // Get other socket IDs in this room for WebRTC connections
//         const otherSocketIds = rooms[roomId].filter(id => id !== socket.id);
//         socket.emit("all-users", otherSocketIds);
        
//         // Notify others in the room that someone joined
//         socket.to(roomId).emit("user-joined", socket.id);
//       } catch (error) {
//         console.error("Error in join-room:", error);
//         socket.emit("error", { message: "Failed to join room" });
//       }
//     });

//     // 🔹 WebRTC Offer
//     socket.on("offer", (data) => {
//       io.to(data.target).emit("offer", { sender: socket.id, offer: data.offer });
//     });

//     // 🔹 WebRTC Answer
//     socket.on("answer", (data) => {
//       io.to(data.target).emit("answer", { sender: socket.id, answer: data.answer });
//     });

//     // 🔹 ICE Candidate
//     socket.on("ice-candidate", (data) => {
//       io.to(data.target).emit("ice-candidate", { sender: socket.id, candidate: data.candidate });
//     });

//     // 🔹 User leaves
//     socket.on("disconnect", async () => {
//       try {
//         // Get user ID before cleanup
//         const userId = socketToUserMap.get(socket.id);
        
//         // Find all rooms this socket was in
//         for (let roomId in rooms) {
//           if (rooms[roomId].includes(socket.id)) {
//             // Remove from in-memory tracking
//             rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
            
//             // Notify others that user left
//             io.to(roomId).emit("user-left", socket.id);
            
//             // Only update DB if we have a userId
//             if (userId) {
//               // Update MongoDB to remove user from room
//               await Room.findByIdAndUpdate(
//                 roomId,
//                 { $pull: { participants: { userId: new mongoose.Types.ObjectId(userId) } } }
//               );
              
//               // Check if room is empty and update lastParticipantLeftAt
//               const room = await Room.findById(roomId);
//               if (room && room.participants.length === 0) {
//                 room.lastParticipantLeftAt = new Date();
//                 await room.save();
//               }
//             }
//           }
//         }
        
//         // Remove from socket map
//         socketToUserMap.delete(socket.id);
//       } catch (error) {
//         console.error("Error in disconnect handler:", error);
//       }
//     });
//   });

//   return io;
// };

// export default setupSignaling;



import { Server } from "socket.io";
import mongoose from "mongoose";

const setupSignaling = (server, Room, User) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store active connections by room
  const rooms = {};
  // Map socket IDs to user IDs for tracking
  const socketToUserMap = new Map();
  // Track active screen sharers by room
  const screenSharings = {};

  io.on("connection", async (socket) => {
    console.log("🔗 New user connected:", socket.id);

    // Get user ID from socket authentication
    const userId = socket.handshake.auth.userId;
    if (userId) {
      socketToUserMap.set(socket.id, userId);
    } else {
      console.warn("Socket connected without user ID:", socket.id);
    }

    // 🔹 User joins a room
    socket.on("join-room", async (roomId) => {
      try {
        // Get the user ID for this socket
        const userId = socketToUserMap.get(socket.id);
        if (!userId) {
          console.error("No user ID found for socket:", socket.id);
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        // Find the user to get their data
        const user = await User.findById(userId);
        if (!user) {
          console.error("User not found:", userId);
          socket.emit("error", { message: "User not found" });
          return;
        }

        // Find the room
        const room = await Room.findById(roomId);
        if (!room) {
          console.error("Room not found:", roomId);
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Add user to room using the schema method
        try {
          await room.addParticipant(user);
          console.log(`User ${user.fullname} joined room ${room.name}`);
        } catch (err) {
          console.error("Error adding participant:", err.message);
          socket.emit("error", { message: err.message });
          return;
        }

        // Track socket connection in memory for WebRTC signaling
        if (!rooms[roomId]) rooms[roomId] = [];
        rooms[roomId].push(socket.id);
        socket.join(roomId);

        // Get other socket IDs in this room for WebRTC connections
        const otherSocketIds = rooms[roomId].filter(id => id !== socket.id);
        socket.emit("all-users", otherSocketIds);
        
        // Notify others in the room that someone joined
        socket.to(roomId).emit("user-joined", socket.id);
        
        // Send user-socket mappings to everyone
        const roomMappings = {};
        if (rooms[roomId]) {
          rooms[roomId].forEach(socketId => {
            const userId = socketToUserMap.get(socketId);
            if (userId) roomMappings[socketId] = userId;
          });
        }
        
        // Send mappings to all users in the room
        io.to(roomId).emit("user-socket-map", roomMappings);
        
        // Also send info about active screen sharers
        if (screenSharings[roomId] && screenSharings[roomId].size > 0) {
          screenSharings[roomId].forEach(sharerId => {
            // Find socket ID for this user
            let sharerSocketId = null;
            for (const [socketId, userId] of socketToUserMap.entries()) {
              if (userId === sharerId) {
                sharerSocketId = socketId;
                break;
              }
            }
            
            if (sharerSocketId) {
              // Notify the new joiner about existing screen shares
              socket.emit("user-screen-sharing-started", {
                socketId: sharerSocketId,
                userId: sharerId
              });
            }
          });
        }
      } catch (error) {
        console.error("Error in join-room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // 🔹 WebRTC Offer
    socket.on("offer", (data) => {
      io.to(data.target).emit("offer", { sender: socket.id, offer: data.offer });
    });

    // 🔹 WebRTC Answer
    socket.on("answer", (data) => {
      io.to(data.target).emit("answer", { sender: socket.id, answer: data.answer });
    });

    // 🔹 ICE Candidate
    socket.on("ice-candidate", (data) => {
      io.to(data.target).emit("ice-candidate", { sender: socket.id, candidate: data.candidate });
    });
    
    // 🔹 Screen Sharing Started
    socket.on("screen-sharing-started", async (roomId) => {
      try {
        const userId = socketToUserMap.get(socket.id);
        if (!userId) {
          console.error("No user ID found for socket:", socket.id);
          return;
        }

        // Track this user as a screen sharer
        if (!screenSharings[roomId]) screenSharings[roomId] = new Set();
        screenSharings[roomId].add(userId);
        
        // Notify everyone in the room
        io.to(roomId).emit("user-screen-sharing-started", { 
          socketId: socket.id, 
          userId: userId 
        });
        
        console.log(`User ${userId} started screen sharing in room ${roomId}`);
      } catch (error) {
        console.error("Error in screen-sharing-started:", error);
      }
    });

    // 🔹 Screen Sharing Stopped
    socket.on("screen-sharing-stopped", async (roomId) => {
      try {
        const userId = socketToUserMap.get(socket.id);
        if (!userId) {
          console.error("No user ID found for socket:", socket.id);
          return;
        }

        // Remove user from screen sharers
        if (screenSharings[roomId]) {
          screenSharings[roomId].delete(userId);
        }
        
        // Notify everyone in the room
        io.to(roomId).emit("user-screen-sharing-stopped", { 
          userId: userId 
        });
        
        console.log(`User ${userId} stopped screen sharing in room ${roomId}`);
      } catch (error) {
        console.error("Error in screen-sharing-stopped:", error);
      }
    });

    // 🔹 WebRTC Screen Sharing Signaling
    socket.on("screen-offer", (data) => {
      io.to(data.target).emit("screen-offer", { 
        sender: socket.id, 
        offer: data.offer 
      });
    });

    socket.on("screen-answer", (data) => {
      io.to(data.target).emit("screen-answer", { 
        sender: socket.id, 
        answer: data.answer 
      });
    });

    socket.on("screen-ice-candidate", (data) => {
      io.to(data.target).emit("screen-ice-candidate", { 
        sender: socket.id, 
        candidate: data.candidate 
      });
    });

    // 🔹 User leaves
    socket.on("disconnect", async () => {
      try {
        // Get user ID before cleanup
        const userId = socketToUserMap.get(socket.id);
        
        // Find all rooms this socket was in
        for (let roomId in rooms) {
          if (rooms[roomId].includes(socket.id)) {
            // Remove from in-memory tracking
            rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
            
            // Notify others that user left
            io.to(roomId).emit("user-left", socket.id);
            
            // Only update DB if we have a userId
            if (userId) {
              // Update MongoDB to remove user from room
              await Room.findByIdAndUpdate(
                roomId,
                { $pull: { participants: { userId: new mongoose.Types.ObjectId(userId) } } }
              );
              
              // Check if room is empty and update lastParticipantLeftAt
              const room = await Room.findById(roomId);
              if (room && room.participants.length === 0) {
                room.lastParticipantLeftAt = new Date();
                await room.save();
              }
              
              // Clean up screen sharing state
              if (screenSharings[roomId] && screenSharings[roomId].has(userId)) {
                screenSharings[roomId].delete(userId);
                io.to(roomId).emit("user-screen-sharing-stopped", { userId });
              }
            }
          }
        }
        
        // Remove from socket map
        socketToUserMap.delete(socket.id);
      } catch (error) {
        console.error("Error in disconnect handler:", error);
      }
    });
  });

  return io;
};

export default setupSignaling;