const Chat = require("../models/Chat");

// SAVE MESSAGE
exports.saveMessage = async (req, res) => {
  try {
    const { meetingCode, sender, text } = req.body;

    const chat = new Chat({
      meetingCode,
      sender,
      text,
      time: new Date()
    });

    await chat.save();

    res.status(201).json({
      message: "Message saved",
      chat
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET MESSAGES
exports.getMessages = async (req, res) => {
  try {
    const { meetingCode } = req.params;

    const messages = await Chat.find({ meetingCode }).sort({ time: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE MESSAGES
exports.deleteMessages = async (req, res) => {
  try {
    const { meetingCode } = req.params;

    await Chat.deleteMany({ meetingCode });

    res.json({ message: "Messages deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
