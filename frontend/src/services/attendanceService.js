import api from '../utils/api';

const attendanceService = {
  // Mark attendance for one or more students on a specific date
  markAttendance: async (attendanceData) => {
    try {
      const response = await api.post('/attendance', attendanceData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Attendance saved successfully'
      };
    } catch (error) {
      console.error('Error saving attendance:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to save attendance'
      };
    }
  },
  
  // Get attendance for a specific date
  getAttendanceByDate: async (date) => {
    try {
      const response = await api.get(`/attendance/date/${date}`);
      // Ensure we're accessing the correct structure
      return {
        success: true,
        data: response.data.data || response.data || []
      };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return { success: false, data: [], error: error.message };
    }
  },
  
  // Get attendance history for a specific student
  getStudentAttendance: async (studentId, startDate, endDate) => {
    try {
      let url = `/attendance/student/${studentId}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await api.get(url);
      // Ensure we're accessing the correct structure
      return {
        success: true,
        data: response.data.data || response.data || []
      };
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      return { success: false, data: [], error: error.message };
    }
  },
  
  // Update a specific attendance record
  updateAttendance: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
  
  // Delete an attendance record
  deleteAttendance: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  }
};

export default attendanceService;
