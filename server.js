const app = require('./src/app');
const dotenv = require('dotenv');
const connectDB = require('./src/db/db');
const { Server } = require("socket.io");
const Chat = require("./src/models/Chat");
const Poll = require("./src/models/Poll");
const http = require("http");

dotenv.config();
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const roomUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // =========================
  // JOIN ROOM
  // =========================
  socket.on("join-dashboard", ({ meetingCode, user }) => {
    socket.join(meetingCode);

    if (!roomUsers[meetingCode]) {
      roomUsers[meetingCode] = [];
    }

    
    roomUsers[meetingCode] = roomUsers[meetingCode].filter(
      (u) => u.id !== socket.id
    );

    roomUsers[meetingCode].push({
      id: socket.id,
      ...user,
      online: true,
    });

    console.log("Room users:", roomUsers[meetingCode]);

    // ✅ SEND TO ALL USERS
    io.to(meetingCode).emit("dashboard-users", roomUsers[meetingCode]);

    

    
  });

  socket.on("start-meeting", ({ meetingCode }) => {
      console.log("Meeting started:", meetingCode);

      io.to(meetingCode).emit("meeting-started", {
        meetingCode
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

    for (const room in roomUsers) {
      roomUsers[room] = roomUsers[room].filter(
        (user) => user.id !== socket.id
      );

      io.to(room).emit("dashboard-users", roomUsers[room]);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});