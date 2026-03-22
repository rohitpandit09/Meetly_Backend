const express = require("express");
const router = express.Router();
const Poll = require("../models/Poll");


// ✅ CREATE POLL
router.post("/", async (req, res) => {
  try {
    const { meetingCode, question, options, duration, createdBy } = req.body;

    const expiresAt = new Date(Date.now() + duration * 1000);

    const poll = await Poll.create({
      meetingCode,
      question,
      options: options.map((o) => ({ text: o })),
      createdBy,
      expiresAt,
    });

    res.json(poll);
  } catch (err) {
    console.error(err);
  }
});


// ✅ GET ACTIVE POLL
router.get("/:meetingCode", async (req, res) => {
  try {
    const poll = await Poll.findOne({
      meetingCode: req.params.meetingCode,
      isActive: true,
    });

    res.json(poll);
  } catch (err) {
    console.error(err);
  }
});


// ✅ VOTE
router.post("/vote/:pollId", async (req, res) => {
  try {
    const { optionIndex } = req.body;

    const poll = await Poll.findById(req.params.pollId);

    if (!poll || !poll.isActive) {
      return res.status(400).json({ message: "Poll ended" });
    }

    poll.options[optionIndex].votes += 1;
    await poll.save();

    res.json(poll);
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;