const express = require("express");
const router = express.Router();
const {
  saveMessage,
  getMessages,
  deleteMessages
} = require("../controllers/chatController");

// Save message
router.post("/", saveMessage);

// Get all messages for a meeting
router.get("/:meetingCode", getMessages);

// Delete all messages for a meeting
router.delete("/:meetingCode", deleteMessages);

module.exports = router;