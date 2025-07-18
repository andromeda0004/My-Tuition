const express = require("express");
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  createMultipleStudents
} = require("../controllers/studentController");

const router = express.Router();

router.route("/")
  .get(getStudents)
  .post(createStudent);

// New route for bulk student creation
router.route("/bulk")
  .post(createMultipleStudents);

router.route("/:id")
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
