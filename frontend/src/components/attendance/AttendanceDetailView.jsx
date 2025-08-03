import { formatGrade } from '../../utils/helpers';

const AttendanceDetailView = ({ attendanceData, loading, stats }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <svg className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto"></svg>
        <p className="mt-2 text-gray-500">Loading attendance data...</p>
      </div>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">No attendance records found for this date</p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="text-center px-4 py-2 bg-green-100 rounded-md">
          <div className="text-xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-green-800">Present</div>
        </div>
        <div className="text-center px-4 py-2 bg-red-100 rounded-md">
          <div className="text-xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-sm text-red-800">Absent</div>
        </div>
        <div className="text-center px-4 py-2 bg-gray-100 rounded-md">
          <div className="text-xl font-bold text-gray-600">{stats.total}</div>
          <div className="text-sm text-gray-800">Total</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="responsive-table min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Grade</th>
              <th className="px-4 py-2 text-left">Batch</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Marked At</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map(record => {
              // Safely access student properties
              const student = record.student || {};
              const studentName = student === 'Student not found' ? 'Unknown' : student.name;
              const studentGrade = student !== 'Student not found' && student.grade ? formatGrade(student.grade) : 'N/A';
              const studentBatch = student !== 'Student not found' ? student.batch : 'N/A';
              
              // Format time for display - use the formattedDateTime from server
              const timeMarked = record.formattedDateTime || 'Unknown';
              
              return (
                <tr key={record.attendanceId} className="border-b">
                  <td className="px-4 py-3" data-label="Name">{studentName}</td>
                  <td className="px-4 py-3" data-label="Grade">{studentGrade}</td>
                  <td className="px-4 py-3" data-label="Batch">{studentBatch}</td>
                  <td className="px-4 py-3 text-center" data-label="Status">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" data-label="Marked At">
                    <span className="text-sm text-gray-700">{timeMarked}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceDetailView;
