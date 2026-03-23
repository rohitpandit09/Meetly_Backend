const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");



const {
  createAssignment,
  getAssignments,
  submitAssignment
} = require("../controllers/assignmentController");

router.post("/create", upload.single("file"), createAssignment);
router.get("/:meetingCode", getAssignments);
router.post("/submit", upload.single("file"),submitAssignment);

module.exports = router;