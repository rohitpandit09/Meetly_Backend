const express = require("express");
const router = express.Router();
const {
  createPoll,
  votePoll,
  getMeetingPolls,
  endPoll
} = require("../controllers/pollController");

// Create poll
router.post("/", createPoll);

// Get all polls for a meeting
router.get("/:meetingCode", getMeetingPolls);

// Vote on a poll
router.post("/vote/:pollId", votePoll);

// End poll
router.post("/end/:pollId", endPoll);

module.exports = router;