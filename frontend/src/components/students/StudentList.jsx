import React from 'react';
import { formatGrade } from '../../utils/helpers';

const StudentList = ({ students, onEdit, onDelete, onView }) => {
  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No students found. Add a new student to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="responsive-table min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Grade
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Batch
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fee Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Fees
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap" data-label="Name">
                <div className="text-sm font-medium text-gray-900">{student.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" data-label="Grade">
                <div className="text-sm text-gray-500">{formatGrade(student.grade)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" data-label="Phone">
                <div className="text-sm text-gray-500">{student.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" data-label="Batch">
                <div className="text-sm text-gray-500">{student.batch}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" data-label="Fee Type">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  student.grade >= 9 ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                  {student.grade >= 9 ? 'Yearly' : 'Monthly'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" data-label="Total Fees">
                <div className="text-sm text-gray-500">₹{student.totalFees}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap" data-label="Balance">
                <div className={`text-sm font-medium ${student.balanceFees > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{student.balanceFees}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" data-label="Actions">
                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => onView(student)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(student)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(student)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
