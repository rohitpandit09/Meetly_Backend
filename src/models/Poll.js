const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    meetingCode: String,
    question: String,
    options: [
      {
        text: String,
        votes: { type: Number, default: 0 },
      },
    ],
    createdBy: String,
    Voters: [String], 
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);