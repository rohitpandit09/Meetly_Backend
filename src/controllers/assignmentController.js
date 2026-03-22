const Assignment = require("../models/Assignment");


// ================= CREATE ASSIGNMENT =================
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, meetingCode, teacherId } = req.body;
    const fileUrl = req.file ? req.file.filename : null;

    const assignment = new Assignment({
      title,
      description,
      dueDate,
      meetingCode,
      createdBy: teacherId,
      fileUrl,
      submissions: []
    });

    await assignment.save();

    res.json({ message: "Assignment created", assignment });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ================= GET ASSIGNMENTS =================
exports.getAssignments = async (req, res) => {
  try {
    const { meetingCode } = req.params;

    const assignments = await Assignment.find({ meetingCode });

    res.json(assignments);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ================= SUBMIT ASSIGNMENT =================
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId, studentName } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const already = assignment.submissions.find(
      (s) => s.studentId === studentId
    );

    if (already) {
      return res.status(400).json({ message: "Already submitted" });
    }

    assignment.submissions.push({
      studentId,
      studentName,
      submitted: true,
      fileName: `${studentName}_submission.pdf`,
      time: new Date().toLocaleString(),
      late: new Date() > new Date(assignment.dueDate)
    });

    await assignment.save();

    res.json({ message: "Assignment submitted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};