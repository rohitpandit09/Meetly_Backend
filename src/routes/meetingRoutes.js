const express = require("express");
const router = express.Router();
const {
  createMeeting,
  getMeeting,
  startMeeting,
  endMeeting,
  getChats,
  deleteChats,
  getUserMeetings
} = require("../controllers/meetingController");

router.post("/create", createMeeting);
router.get("/:meetingCode", getMeeting);
router.post("/start", startMeeting);
router.post("/end", endMeeting);
router.get("/:meetingCode/chats", getChats);
router.delete("/:meetingCode/chats", deleteChats);
router.get("/user/:userId", getUserMeetings);

module.exports = router;