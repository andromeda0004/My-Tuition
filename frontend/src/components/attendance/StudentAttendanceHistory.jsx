import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendanceService';
import { toast } from 'react-toastify';

const StudentAttendanceHistory = ({ studentId, studentName }) => {
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({ present: 0, absent: 0, percentage: 0 });

  useEffect(() => {
    if (studentId) {
      fetchAttendanceHistory();
    }
  }, [studentId, dateRange]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = dateRange;
      const response = await attendanceService.getStudentAttendance(studentId, startDate, endDate);
      
      if (response.success) {
        setAttendanceHistory(response.data || []);
        
        // Calculate stats
        const present = response.data.filter(record => record.status).length;
        const total = response.data.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        setStats({
          present,
          absent: total - present,
          percentage
        });
      } else {
        toast.error(`Failed to load attendance history: ${response.error}`);
      }
    } catch (error) {
      toast.error('Failed to load attendance history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Attendance History for {studentName}</h3>
      
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="form-input mt-1"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="form-input mt-1"
          />
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="text-center px-4 py-2 bg-green-100 rounded-md">
          <div className="text-xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-green-800">Present</div>
        </div>
        <div className="text-center px-4 py-2 bg-red-100 rounded-md">
          <div className="text-xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-sm text-red-800">Absent</div>
        </div>
        <div className="text-center px-4 py-2 bg-blue-100 rounded-md">
          <div className="text-xl font-bold text-blue-600">{stats.percentage}%</div>
          <div className="text-sm text-blue-800">Attendance</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading attendance history...</p>
        </div>
      ) : attendanceHistory.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No attendance records found in the selected date range</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map(record => (
                <tr key={record._id} className="border-b">
                  <td className="px-4 py-2">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status ? 'Present' : 'Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceHistory;
