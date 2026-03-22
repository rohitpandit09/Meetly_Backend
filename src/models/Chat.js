const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  meetingCode: String,
  sender: String,
  text: String,
  time: String,
});

module.exports = mongoose.model("Chat", chatSchema);