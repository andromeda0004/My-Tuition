import api from '../utils/api';

const studentService = {
  getAllStudents: async () => {
    const response = await api.get('/students');
    return response.data;
  },
  
  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  
  createStudent: async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },
  
  updateStudent: async (id, studentData) => {
    try {
      const response = await api.put(`/students/${id}`, studentData);
      return response.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },
  
  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
  
  createMultipleStudents: async (studentsArray) => {
    const response = await api.post('/students/bulk', studentsArray);
    return response.data;
  }
};

export default studentService;
