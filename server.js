const app = require("./src/app");
const dotenv = require("dotenv");
const connectDB = require("./src/db/db");
const { Server } = require("socket.io");
const Chat = require("./src/models/Chat");
const Poll = require("./src/models/Poll");
const Meeting = require("./src/models/Meeting");
const http = require("http");

// Routes
const aiRoutes = require("./src/routes/aiRoutes");
const pollRoutes = require("./src/routes/poll.routes.js");

dotenv.config();
connectDB();

app.use("/api/ai", aiRoutes);
app.use("/api/poll", pollRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
  transports: ["websocket", "polling"],
});

// ====================================
// SOCKET.IO STATE MANAGEMENT
// ====================================
const roomUsers = {}; // { meetingCode: [users] }
const roomPeers = {}; // { meetingCode: [peers] }
const screenShareing = {}; // { meetingCode: user sharing screen }
const pollTimers = {}; // { pollId: timeout }

// ====================================
// CONNECTION EVENT
// ====================================
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ====================================
  // JOIN ROOM - Dashboard
  // ====================================
  socket.on("join-dashboard", ({ meetingCode, user }) => {
    socket.join(meetingCode);

    if (!roomUsers[meetingCode]) {
      roomUsers[meetingCode] = [];
    }

    // Remove duplicate users
    roomUsers[meetingCode] = roomUsers[meetingCode].filter(
      (u) => u.id !== socket.id
    );

    // Add user
    roomUsers[meetingCode].push({
      id: socket.id,
      ...user,
      online: true,
      micOn: true,
      videoOn: true
    });

    console.log(`📊 Dashboard users in ${meetingCode}:`, roomUsers[meetingCode]);

    // Emit to all users in room
    io.to(meetingCode).emit("dashboard-users", roomUsers[meetingCode]);
  });

  // ====================================
  // JOIN ROOM - WebRTC
  // ====================================
  socket.on("join-room", ({ meetingCode, user }) => {
    socket.join(meetingCode);

    if (!roomPeers[meetingCode]) {
      roomPeers[meetingCode] = [];
    }

    // Send existing users to new user
    const existingUsers = roomPeers[meetingCode].map((u) => ({
      socketId: u.socketId,
      user: u.user,
    }));

    socket.emit("all-users", existingUsers);

    // Add new user
    roomPeers[meetingCode].push({
      socketId: socket.id,
      user,
    });

    // Tell others new user joined
    socket.to(meetingCode).emit("user-joined", {
      socketId: socket.id,
      user,
    });

    console.log(`🎥 Users in room ${meetingCode}:`, roomPeers[meetingCode]);
  });

  // ====================================
  // START MEETING
  // ====================================
  socket.on("start-meeting", ({ meetingCode }) => {
    console.log("🎬 Meeting started:", meetingCode);
    io.to(meetingCode).emit("meeting-started", { meetingCode });
  });

  // ====================================
  // WEBRTC - OFFER
  // ====================================
  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", {
      from: socket.id,
      offer,
    });
    console.log(`📤 Offer sent from ${socket.id} to ${to}`);
  });

  // ====================================
  // WEBRTC - ANSWER
  // ====================================
  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", {
      from: socket.id,
      answer,
    });
    console.log(`📥 Answer sent from ${socket.id} to ${to}`);
  });

  // ====================================
  // WEBRTC - ICE CANDIDATE
  // ====================================
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", {
      from: socket.id,
      candidate,
    });
  });

  // ====================================
  // TOGGLE MEDIA (Mic/Camera)
  // ====================================
  socket.on("toggle-media", ({ meetingCode, mediaType, enabled }) => {
    // Update user media status
    if (roomUsers[meetingCode]) {
      const user = roomUsers[meetingCode].find((u) => u.id === socket.id);
      if (user) {
        if (mediaType === "mic") user.micOn = enabled;
        if (mediaType === "video") user.videoOn = enabled;
      }
    }

    // Broadcast media change
    io.to(meetingCode).emit("user-media-changed", {
      userId: socket.id,
      mediaType,
      enabled,
    });

    console.log(`🎙️ Media toggled:`, {
      userId: socket.id,
      mediaType,
      enabled,
    });
  });

  // ====================================
  // SCREEN SHARING - START
  // ====================================
  socket.on("screen-share-start", ({ meetingCode, user }) => {
    screenShareing[meetingCode] = {
      userId: socket.id,
      user,
    };

    io.to(meetingCode).emit("screen-share-started", {
      userId: socket.id,
      user,
    });

    console.log(`📺 Screen sharing started by ${socket.id}`);
  });

  // ====================================
  // SCREEN SHARING - STOP
  // ====================================
  socket.on("screen-share-stop", ({ meetingCode }) => {
    delete screenShareing[meetingCode];

    io.to(meetingCode).emit("screen-share-stopped", {
      userId: socket.id,
    });

    console.log(`📺 Screen sharing stopped by ${socket.id}`);
  });

  // ====================================
  // CHAT - SEND MESSAGE
  // ====================================
  socket.on("send-message", async ({ meetingCode, sender, text }) => {
    try {
      // Save to database
      const chat = new Chat({
        meetingCode,
        sender,
        text,
        time: new Date(),
      });

      await chat.save();

      // Emit to all in room
      io.to(meetingCode).emit("receive-message", {
        sender,
        text,
        time: new Date(),
      });

      console.log(`💬 Message sent in ${meetingCode}: ${sender}`);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // ====================================
  // POLL - CREATE POLL
  // ====================================
  socket.on("create-poll", async ({ meetingCode, question, options, duration, createdBy }) => {
    try {
      const expiresAt = new Date(Date.now() + duration * 1000);

      const poll = new Poll({
        meetingCode,
        question,
        options: options.map((text) => ({ text, votes: 0 })),
        createdBy,
        isActive: true,
        expiresAt,
        Voters: [],
      });

      await poll.save();

      // Emit poll to all in room
      io.to(meetingCode).emit("poll-created", poll);

      // Auto-end poll after duration
      pollTimers[poll._id.toString()] = setTimeout(async () => {
        const endedPoll = await Poll.findByIdAndUpdate(
          poll._id,
          { isActive: false },
          { new: true }
        );

        io.to(meetingCode).emit("poll-ended", endedPoll);
        delete pollTimers[poll._id.toString()];

        console.log(`⏰ Poll ended: ${poll.question}`);
      }, duration * 1000);

      console.log(`📊 Poll created: ${poll.question}`);
    } catch (err) {
      console.error("Error creating poll:", err);
    }
  });

  // ====================================
  // POLL - VOTE
  // ====================================
  socket.on("poll-vote", async ({ pollId, optionIndex, voterId }) => {
    try {
      const poll = await Poll.findById(pollId);

      if (!poll || !poll.isActive) {
        return socket.emit("error", { message: "Poll not active" });
      }

      // Check if already voted
      if (poll.Voters.includes(voterId)) {
        return socket.emit("error", { message: "Already voted" });
      }

      // Record vote
      poll.options[optionIndex].votes += 1;
      poll.Voters.push(voterId);
      await poll.save();

      // Emit updated poll to all in meetingCode
      io.to(poll.meetingCode).emit("poll-updated", poll);

      console.log(`🗳️ Vote recorded on poll: ${poll.question}`);
    } catch (err) {
      console.error("Error voting on poll:", err);
    }
  });

  // ====================================
  // USER LEFT ROOM
  // ====================================
  socket.on("leave-room", ({ meetingCode }) => {
    socket.leave(meetingCode);

    // Remove from roomPeers
    if (roomPeers[meetingCode]) {
      roomPeers[meetingCode] = roomPeers[meetingCode].filter(
        (u) => u.socketId !== socket.id
      );
    }

    // Remove from roomUsers
    if (roomUsers[meetingCode]) {
      roomUsers[meetingCode] = roomUsers[meetingCode].filter(
        (u) => u.id !== socket.id
      );

      io.to(meetingCode).emit("user-left", {
        userId: socket.id,
        remainingUsers: roomUsers[meetingCode],
      });
    }

    console.log(`👋 User left: ${socket.id}`);
  });

  // ====================================
  // USER DISCONNECTED
  // ====================================
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    // Clean up from all rooms
    Object.keys(roomUsers).forEach((meetingCode) => {
      roomUsers[meetingCode] = roomUsers[meetingCode].filter(
        (u) => u.id !== socket.id
      );

      if (roomUsers[meetingCode].length === 0) {
        delete roomUsers[meetingCode];
      } else {
        io.to(meetingCode).emit("user-left", {
          userId: socket.id,
          remainingUsers: roomUsers[meetingCode],
        });
      }
    });

    Object.keys(roomPeers).forEach((meetingCode) => {
      roomPeers[meetingCode] = roomPeers[meetingCode].filter(
        (u) => u.socketId !== socket.id
      );

      if (roomPeers[meetingCode].length === 0) {
        delete roomPeers[meetingCode];
      }
    });

    // Stop screen share if user was sharing
    Object.keys(screenShareing).forEach((meetingCode) => {
      if (screenShareing[meetingCode].userId === socket.id) {
        io.to(meetingCode).emit("screen-share-stopped", { userId: socket.id });
        delete screenShareing[meetingCode];
      }
    });
  });

  // ====================================
  // ERROR HANDLING
  // ====================================
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// ====================================
// START SERVER
// ====================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
  
  socket.on("check-meeting-status", ({ meetingCode }) => {
    socket.emit("meeting-status", {
      isLive: meetingStatus[meetingCode] || false,
    });
  });

  // =========================
  // CREATE POLL
  // =========================
  socket.on("create-poll", async (data) => {
    try {
      const poll = await Poll.create({
        meetingCode: data.meetingCode,
        question: data.question,
        options: data.options.map((o) => ({ text: o, votes: 0 })),
        createdBy: data.createdBy,
        expiresAt: new Date(Date.now() + data.duration * 1000),
      });

      io.to(data.meetingCode).emit("poll-created", poll);

      // ⏳ AUTO END
      setTimeout(async () => {
        const updated = await Poll.findByIdAndUpdate(
          poll._id,
          { isActive: false },
          { new: true }
        );

        io.to(data.meetingCode).emit("poll-ended", updated);
      }, data.duration * 1000);

    } catch (err) {
      console.error("Poll error:", err);
    }
  });

  // =========================
  // VOTE (🔥 FIXED POSITION)
  // =========================
  socket.on("vote", async ({ pollId, optionIndex, meetingCode }) => {
    try {
      const poll = await Poll.findById(pollId);

      if (!poll || !poll.isActive) return;
      if (poll.voters.includes(userName)) return; // already voted

      poll.options[optionIndex].votes += 1;
      poll.voters.push(userName); // mark as voted
      await poll.save();

      io.to(meetingCode).emit("poll-updated", poll);

    } catch (err) {
      console.error("Vote error:", err);
    }
  });

  // =========================
  // WEBRTC SIGNALING
  // =========================
  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", {
      from: socket.id,
      offer,
    });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", {
      from: socket.id,
      answer,
    });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", {
      from: socket.id,
      candidate,
    });
  });

  // =========================
  // CHAT
  // =========================
  socket.on("send-message", async ({ meetingCode, message }) => {
    try {

      io.to(meetingCode).emit("receive-message", message);

      await Chat.create({
        meetingCode,
        sender: message.sender,
        text: message.content,
        time: message.time,
      });

      

    } catch (err) {
      console.error("Chat error:", err);
    }
  });

  // =========================
  // MEDIA TOGGLE
  // =========================
  socket.on("toggle-media", ({ meetingCode, userName, type }) => {
    io.to(meetingCode).emit("media-toggled", {
      userName,
      type,
    });
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
  console.log("User disconnected:", socket.id);

  for (const room in roomPeers) {
    roomPeers[room] = roomPeers[room].filter(
      (id) => id !== socket.id
    );

    socket.to(room).emit("user-left", socket.id);
  }
});
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});