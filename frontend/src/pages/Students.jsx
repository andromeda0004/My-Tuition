import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import StudentList from '../components/students/StudentList';
import StudentForm from '../components/students/StudentForm';
import StudentDetail from '../components/students/StudentDetail';
import Modal from '../components/ui/Modal';
import studentService from '../services/studentService';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Student being operated on
  const [currentStudent, setCurrentStudent] = useState(null);
  
  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);
  
  // Filter students based on search term and grade filter
  const filteredStudents = students.filter(student => {
    // First apply search filter
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm) ||
      student.batch.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Then apply grade filter
    let matchesGrade = true;
    if (gradeFilter === 'junior') {
      matchesGrade = student.grade <= 8;
    } else if (gradeFilter === 'senior') {
      matchesGrade = student.grade >= 9;
    }
    
    return matchesSearch && matchesGrade;
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getAllStudents();
      setStudents(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch students');
      toast.error('Could not load students');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddStudent = async (studentData) => {
    try {
      await studentService.createStudent(studentData);
      toast.success('Student added successfully');
      setShowAddModal(false);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to add student');
    }
  };
  
  const handleEditStudent = async (studentData) => {
    try {
      const result = await studentService.updateStudent(currentStudent._id, studentData);
      
      // Update the local students array with the updated student
      const updatedStudents = students.map(student => 
        student._id === currentStudent._id ? result.data : student
      );
      setStudents(updatedStudents);
      
      toast.success('Student updated successfully');
      setShowEditModal(false);
    } catch (err) {
      toast.error(`Failed to update student: ${err.message}`);
    }
  };
  
  const handleDeleteStudent = async () => {
    try {
      await studentService.deleteStudent(currentStudent._id);
      toast.success('Student deleted successfully');
      setShowDeleteModal(false);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };
  
  const openEditModal = (student) => {
    setCurrentStudent(student);
    setShowEditModal(true);
  };
  
  const openDetailModal = (student) => {
    setCurrentStudent(student);
    setShowDetailModal(true);
  };
  
  const openDeleteModal = (student) => {
    setCurrentStudent(student);
    setShowDeleteModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Students</h1>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 pr-4 py-2"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="form-input py-2"
          >
            <option value="all">All Grades</option>
            <option value="junior">1st - 8th Grade</option>
            <option value="senior">9th - 10th Grade</option>
          </select>
          
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary"
          >
            Add Student
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-10 w-10 text-primary-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-500">Loading students...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchStudents} 
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      ) : (
        <StudentList 
          students={filteredStudents} 
          onEdit={openEditModal} 
          onDelete={openDeleteModal} 
          onView={openDetailModal} 
        />
      )}
      
      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student"
      >
        <StudentForm 
          onSubmit={handleAddStudent} 
          onCancel={() => setShowAddModal(false)} 
        />
      </Modal>
      
      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Student"
      >
        <StudentForm 
          student={currentStudent} 
          onSubmit={handleEditStudent} 
          onCancel={() => setShowEditModal(false)} 
        />
      </Modal>
      
      {/* View Student Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Student Details"
      >
        <StudentDetail 
          student={currentStudent} 
          onClose={() => setShowDetailModal(false)} 
          onEdit={() => {
            setShowDetailModal(false);
            openEditModal(currentStudent);
          }} 
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-secondary mr-3"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStudent}
              className="btn btn-danger"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete {currentStudent?.name}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Students;
