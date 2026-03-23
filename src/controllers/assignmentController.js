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

    let submission = assignment.submissions.find(
      (s) => s.studentId === studentId
    );

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (!submission) {
      submission = {
        studentId,
        studentName,
        submitted: false,
      };
      assignment.submissions.push(submission);
    }

   
    const file = req.file;

    submission.fileName = file ? file.filename : null;
    submission.submitted = true;
    submission.time = new Date();
    submission.late = new Date() > assignment.dueDate;

    await assignment.save();

    res.json({ success: true });

  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ error: "Submission failed" });
  }
};