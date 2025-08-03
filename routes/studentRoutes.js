const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  createMultipleStudents
} = require('../controllers/studentController');

// Define routes
router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/bulk')
  .post(createMultipleStudents);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router; // Make sure to export the router
