import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import attendanceService from '../services/attendanceService';
import studentService from '../services/studentService';
import { formatGrade } from '../utils/helpers';
import AttendanceDetailView from '../components/attendance/AttendanceDetailView';

const Attendance = () => {
  // State for date, time and attendance data
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceTimeMap, setAttendanceTimeMap] = useState({}); // New state for time tracking
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('mark');
  
  // View tab state
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, total: 0 });
  
  // Default time (IST current time)
  const getCurrentISTTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Load students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);
  
  // When date changes or tab changes, fetch appropriate data
  useEffect(() => {
    if (activeTab === 'mark') {
      fetchAttendanceForDate(date);
    } else if (activeTab === 'view') {
      fetchAttendanceForViewMode(viewDate);
    }
  }, [date, viewDate, activeTab]);
  
  // Fetch students list
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getAllStudents();
      if (response.success) {
        setStudents(response.data || []);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      toast.error('Failed to load students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch attendance for marking
  const fetchAttendanceForDate = useCallback(async (fetchDate) => {
    try {
      setLoading(true);
      
      const formattedDate = new Date(fetchDate).toISOString().split('T')[0];
      const response = await attendanceService.getAttendanceByDate(formattedDate);
      
      if (response.success) {
        // Initialize maps for status and time
        const statusMap = {};
        const timeMap = {};
        
        // First set defaults - all absent with current time
        students.forEach(student => {
          statusMap[student._id] = false;
          timeMap[student._id] = getCurrentISTTime();
        });
        
        // Then update with saved data
        response.data.forEach(item => {
          if (item && item.student && item.student.id) {
            statusMap[item.student.id] = item.status === true;
            
            // Extract time from the record
            if (item.time) {
              timeMap[item.student.id] = item.time.substring(0, 5); // HH:MM format
            }
          }
        });
        
        setAttendanceMap(statusMap);
        setAttendanceTimeMap(timeMap);
      } else {
        toast.error(`Failed to load attendance: ${response.error || 'Unknown error'}`);
        
        // Initialize empty maps as fallback
        const defaultStatusMap = {};
        const defaultTimeMap = {};
        const currentTime = getCurrentISTTime();
        
        students.forEach(student => {
          defaultStatusMap[student._id] = false;
          defaultTimeMap[student._id] = currentTime;
        });
        
        setAttendanceMap(defaultStatusMap);
        setAttendanceTimeMap(defaultTimeMap);
      }
    } catch (error) {
      console.error('Error in fetchAttendanceForDate:', error);
      toast.error(`Failed to load attendance data`);
    } finally {
      setLoading(false);
    }
  }, [students]);
  
  // Fetch attendance for viewing
  const fetchAttendanceForViewMode = async (fetchDate) => {
    try {
      setLoading(true);
      
      const formattedDate = new Date(fetchDate).toISOString().split('T')[0];
      const response = await attendanceService.getAttendanceByDate(formattedDate);
      
      if (response.success) {
        setAttendanceData(response.data || []);
        
        // Calculate attendance stats
        const present = response.data.filter(record => record.status).length;
        const totalStudents = students.length;
        const absent = Math.max(0, totalStudents - present);
        
        setAttendanceStats({
          present,
          absent,
          total: totalStudents
        });
      } else {
        toast.error(`Failed to load attendance: ${response.error || 'Unknown error'}`);
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Error in fetchAttendanceForViewMode:', error);
      toast.error(`Failed to load attendance for ${fetchDate}`);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle attendance status
  const toggleAttendance = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };
  
  // Update attendance time
  const updateAttendanceTime = (studentId, time) => {
    setAttendanceTimeMap(prev => ({
      ...prev,
      [studentId]: time
    }));
  };
  
  // Submit attendance data
  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      
      // Validate that we have students to mark attendance for
      if (students.length === 0) {
        toast.error('No students found to mark attendance');
        return;
      }
      
      // Create a formatted date string for consistency
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      // Prepare attendance records for all students
      const records = students.map(student => ({
        studentId: student._id,
        date: formattedDate,
        status: attendanceMap[student._id] === true,
        time: attendanceTimeMap[student._id] || getCurrentISTTime()
      }));
      
      // Send attendance data to server
      const result = await attendanceService.markAttendance({ 
        date: formattedDate, 
        records 
      });
      
      if (result.success) {
        toast.success(result.message || 'Attendance saved successfully');
        
        // If we're on the view tab and viewing the same date, refresh the view
        if (activeTab === 'view' && viewDate === date) {
          fetchAttendanceForViewMode(date);
        }
      } else {
        toast.error(result.error || 'Failed to save attendance');
        console.error('Error saving attendance:', result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Attendance submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Helper functions
  const markAllPresent = () => {
    const newMap = {};
    students.forEach(student => {
      newMap[student._id] = true;
    });
    setAttendanceMap(newMap);
  };
  
  const markAllAbsent = () => {
    const newMap = {};
    students.forEach(student => {
      newMap[student._id] = false;
    });
    setAttendanceMap(newMap);
  };
  
  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // If switching to view tab, use the current marking date
    if (tab === 'view' && activeTab === 'mark') {
      setViewDate(date);
      // Force fetch for the current date when switching tabs
      setTimeout(() => fetchAttendanceForViewMode(date), 0);
    }
  };
  
  // Group students by grade for better organization
  const groupedStudents = students.reduce((acc, student) => {
    const grade = student.grade;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(student);
    return acc;
  }, {});
  
  // Sort grades for display
  const sortedGrades = Object.keys(groupedStudents).sort((a, b) => a - b);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Attendance</h1>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex space-x-1">
            <button 
              onClick={() => handleTabChange('mark')} 
              className={`px-4 py-2 rounded-md ${
                activeTab === 'mark' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Mark Attendance
            </button>
            <button 
              onClick={() => handleTabChange('view')} 
              className={`px-4 py-2 rounded-md ${
                activeTab === 'view' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              View Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === 'mark' && (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="mb-4 md:mb-0">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={markAllPresent}
                  className="btn bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                  disabled={loading || submitting}
                >
                  Mark All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  disabled={loading || submitting}
                >
                  Mark All Absent
                </button>
                <button
                  onClick={handleSubmitAttendance}
                  className="btn btn-primary"
                  disabled={loading || submitting}
                >
                  {submitting ? 'Saving...' : 'Save Attendance'}
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
            ) : (
              <div>
                {sortedGrades.length === 0 ? (
                  <p className="text-center text-gray-500">No students found</p>
                ) : (
                  sortedGrades.map(grade => (
                    <div key={grade} className="mb-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-3">
                        {formatGrade(grade)} Grade
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="responsive-table min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Batch</th>
                              <th className="px-4 py-2 text-center">Attendance</th>
                              <th className="px-4 py-2 text-center">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedStudents[grade].map(student => (
                              <tr key={student._id} className="border-b">
                                <td className="px-4 py-3" data-label="Name">
                                  {student.name}
                                </td>
                                <td className="px-4 py-3" data-label="Batch">
                                  {student.batch}
                                </td>
                                <td className="px-4 py-3 text-center" data-label="Attendance">
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => toggleAttendance(student._id)}
                                      className={`w-24 py-1 rounded-full ${
                                        attendanceMap[student._id] 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {attendanceMap[student._id] ? 'Present' : 'Absent'}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center" data-label="Time">
                                  <input
                                    type="time"
                                    value={attendanceTimeMap[student._id] || getCurrentISTTime()}
                                    onChange={(e) => updateAttendanceTime(student._id, e.target.value)}
                                    className="form-input w-24 py-1 text-center"
                                    disabled={!attendanceMap[student._id]} // Only enable if present
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmitAttendance}
              className="btn btn-primary px-8"
              disabled={loading || submitting}
            >
              {submitting ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}

      {/* View Attendance Tab */}
      {activeTab === 'view' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="mb-4 md:mb-0">
              <label htmlFor="viewDate" className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <div className="flex items-center">
                <input
                  type="date"
                  id="viewDate"
                  name="viewDate"
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                  className="form-input"
                />
                <button
                  onClick={() => fetchAttendanceForViewMode(viewDate)}
                  className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded"
                  title="Refresh attendance data"
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Showing attendance for: <strong>{new Date(viewDate).toLocaleDateString()}</strong>
            </p>
          </div>

          <AttendanceDetailView 
            attendanceData={attendanceData}
            loading={loading}
            stats={attendanceStats}
          />
        </div>
      )}
    </div>
  );
};

export default Attendance;
