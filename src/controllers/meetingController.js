const Meeting = require("../models/Meeting");
const Chat = require("../models/Chat");
const Poll = require("../models/Poll");

// Generate random meeting code
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// CREATE MEETING
exports.createMeeting = async (req, res) => {
  try {
    const { name, description, hostId } = req.body;

    if (!name || !description || !hostId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const meetingCode = generateCode();

    const meeting = new Meeting({
      className: name,
      description: description,
      meetingCode: meetingCode,
      hostId: hostId,
      isLive: false
    });

    await meeting.save();

    res.json({
      message: "Meeting created successfully",
      meetingCode,
      meeting
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET MEETING
exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingCode: req.params.meetingCode
    }).populate("hostId", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// START MEETING
exports.startMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;

    const meeting = await Meeting.findOneAndUpdate(
      { meetingCode },
      { isLive: true },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({
      message: "Meeting started",
      meeting
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// END MEETING
exports.endMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;

    const meeting = await Meeting.findOneAndUpdate(
      { meetingCode },
      { isLive: false, endedAt: new Date() },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({
      message: "Meeting ended",
      meeting
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL CHATS
exports.getChats = async (req, res) => {
  try {
    const { meetingCode } = req.params;

    const chats = await Chat.find({ meetingCode }).sort({ time: 1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE CHATS WHEN MEETING ENDS
exports.deleteChats = async (req, res) => {
  try {
    const { meetingCode } = req.body;

    await Chat.deleteMany({ meetingCode });

    res.json({ message: "Chats deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET USER MEETINGS
exports.getUserMeetings = async (req, res) => {
  try {
    const { userId } = req.params;

    const meetings = await Meeting.find({ hostId: userId }).sort({
      createdAt: -1
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};