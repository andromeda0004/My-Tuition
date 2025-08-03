import React, { useState } from 'react';
import { formatGrade } from '../../utils/helpers';
import StudentAttendanceHistory from '../attendance/StudentAttendanceHistory';

const StudentDetail = ({ student, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'attendance'
  
  if (!student) return null;

  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h3 className="text-xl font-medium text-gray-900">{student.name}</h3>
        <p className="text-sm text-gray-500">ID: {student._id}</p>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 ${
            activeTab === 'details'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Student Details
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 ${
            activeTab === 'attendance'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Attendance History
        </button>
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
            <p className="text-base">{student.phone}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Grade</h4>
            <p className="text-base">{formatGrade(student.grade)} Grade</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Batch</h4>
            <p className="text-base">{student.batch}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Fee Structure</h4>
            <p className="text-base">
              {student.grade >= 9 ? 'Yearly' : 'Monthly'} 
              ({student.grade >= 9 
                ? `₹${student.yearlyFees} per year` 
                : `₹${student.monthlyFees} per month`})
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total Fees</h4>
            <p className="text-base">₹{student.totalFees}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Paid Fees</h4>
            <p className="text-base">₹{student.paidFees}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Balance Fees</h4>
            <p className={`text-base font-medium ${student.balanceFees > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{student.balanceFees}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Created At</h4>
            <p className="text-base">{new Date(student.createdAt).toLocaleDateString()}</p>
          </div>
          
          {student.notes && (
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-gray-500">Notes</h4>
              <p className="text-base">{student.notes}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Attendance history tab */}
      {activeTab === 'attendance' && (
        <StudentAttendanceHistory 
          studentId={student._id}
          studentName={student.name}
        />
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          Close
        </button>
        <button
          onClick={() => onEdit(student)}
          className="btn btn-primary"
        >
          Edit Student
        </button>
      </div>
    </div>
  );
};

export default StudentDetail;
