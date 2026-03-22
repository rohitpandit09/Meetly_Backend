const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

router.get("/:meetingCode", async (req, res) => {
  const chats = await Chat.find({
    meetingCode: req.params.meetingCode,
  });

  res.json(chats);
});

router.delete("/:meetingCode", async (req, res) => {
  try {
    await Chat.deleteMany({
      meetingCode: req.params.meetingCode,
    });

    res.json({ message: "Chats deleted" });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;