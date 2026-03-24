const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const assignmentRoutes = require("./routes/assignmentRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/chat', require('./routes/chat'));


module.exports = app;