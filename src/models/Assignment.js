const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  submitted: { type: Boolean, default: false },
  fileName: String,
  time: String,
  late: { type: Boolean, default: false }
});

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: Date,
  meetingCode: String,
  fileUrl: String,
  createdBy: String,
  submissions: [submissionSchema]
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);