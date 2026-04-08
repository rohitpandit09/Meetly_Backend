const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  meetingCode: {
    type: String,
    unique: true,
    required: true
  },

  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  isLive: {
    type: Boolean,
    default: false
  },

  participants: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      joined_at: { type: Date, default: Date.now }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  },

  endedAt: {
    type: Date
  }
});

module.exports = mongoose.model("Meeting", meetingSchema);