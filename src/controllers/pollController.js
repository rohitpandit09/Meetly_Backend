const Poll = require("../models/Poll");

// CREATE POLL
exports.createPoll = async (req, res) => {
  try {
    const { meetingCode, question, options, duration, createdBy } = req.body;

    const expiresAt = new Date(Date.now() + duration * 1000);

    const poll = new Poll({
      meetingCode,
      question,
      options: options.map((text) => ({ text, votes: 0 })),
      createdBy,
      isActive: true,
      expiresAt,
      Voters: []
    });

    await poll.save();

    res.status(201).json({
      message: "Poll created",
      poll
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// VOTE ON POLL
exports.votePoll = async (req, res) => {
  try {
    const { pollId, optionIndex, voterId } = req.body;

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (!poll.isActive) {
      return res.status(400).json({ message: "Poll is not active" });
    }

    // Check if user already voted
    if (poll.Voters.includes(voterId)) {
      return res.status(400).json({ message: "User already voted" });
    }

    // Increment vote
    poll.options[optionIndex].votes += 1;
    poll.Voters.push(voterId);

    await poll.save();

    res.json({
      message: "Vote recorded",
      poll
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET POLLS FOR MEETING
exports.getMeetingPolls = async (req, res) => {
  try {
    const { meetingCode } = req.params;

    const polls = await Poll.find({ meetingCode }).sort({ createdAt: -1 });

    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// END POLL
exports.endPoll = async (req, res) => {
  try {
    const { pollId } = req.body;

    const poll = await Poll.findByIdAndUpdate(
      pollId,
      { isActive: false },
      { new: true }
    );

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    res.json({
      message: "Poll ended",
      poll
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
