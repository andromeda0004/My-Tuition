const express = require('express');
const {
  generateReminderLink,
  getAllPendingReminders,
  sendCustomMessage
} = require('../controllers/whatsappController');

const router = express.Router();

// Get all students with pending fees and their reminder links
router.get('/pending', getAllPendingReminders);

// Send custom message to a student/parent
router.post('/custom/:studentId', sendCustomMessage);

// Get reminder link for a specific student
router.get('/:studentId', generateReminderLink);

module.exports = router;
