const express = require("express");
const router = express.Router();

const { createMeeting, getMeeting, startMeeting, sendMessage} = require("../controllers/meetingController");

router.post("/create", createMeeting);
router.get("/:meetingCode", getMeeting);
router.post("/start", startMeeting);
router.post("/message", sendMessage);


module.exports = router;