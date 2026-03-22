const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({

  messages: [
  {
    sender: String,
    role: String,
    content: String,
    time: String,
    isNotice: Boolean
  }
],

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
    unique: true
  },

  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  isLive: {
  type: Boolean,
  default: false
}



});

module.exports = mongoose.model("Meeting", meetingSchema);