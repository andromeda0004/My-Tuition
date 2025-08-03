const Student = require("../models/Student");

// @desc    Get all students
// @route   GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Create a new student
// @route   POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const newStudent = await Student.create(req.body);
    res.status(201).json({
      success: true,
      data: newStudent
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid student data", error: error.message });
  }
};

// @desc    Create multiple students at once
// @route   POST /api/students/bulk
exports.createMultipleStudents = async (req, res) => {
  try {
    // Check if the request body is an array
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid data format. Please provide an array of student objects." 
      });
    }
    
    // Validate that the array is not empty
    if (req.body.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Student array cannot be empty." 
      });
    }

    // Create multiple students
    const students = await Student.insertMany(req.body);
    
    res.status(201).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Failed to create students", 
      error: error.message 
    });
  }
};

// @desc    Update a student
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true
    });
    
    if (!updated) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid data", error: error.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const removed = await Student.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
