import React, { useState, useEffect } from 'react';
import { formatGrade } from '../../utils/helpers';

const StudentForm = ({ student, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    grade: 1,
    batch: '',
    feeStructure: 'monthly',
    monthlyFees: 0,
    yearlyFees: 0,
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        phone: student.phone || '',
        grade: student.grade || 1,
        batch: student.batch || '',
        feeStructure: student.feeStructure || 'monthly',
        monthlyFees: student.monthlyFees || 0,
        yearlyFees: student.yearlyFees || 0,
        notes: student.notes || ''
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for grade to update fee structure
    if (name === 'grade') {
      const gradeNum = parseInt(value, 10);
      const newFeeStructure = gradeNum >= 9 ? 'yearly' : 'monthly';
      
      setFormData(prev => ({
        ...prev,
        [name]: gradeNum,
        feeStructure: newFeeStructure
      }));
    } else if (name === 'monthlyFees' || name === 'yearlyFees') {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.batch.trim()) newErrors.batch = 'Batch is required';
    
    // Validate fees based on fee structure
    if (formData.grade >= 9) {
      if (formData.yearlyFees <= 0) newErrors.yearlyFees = 'Yearly fees must be greater than 0';
    } else {
      if (formData.monthlyFees <= 0) newErrors.monthlyFees = 'Monthly fees must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Calculate totalFees based on fee structure before submitting
      const totalFees = formData.grade >= 9 
        ? formData.yearlyFees 
        : formData.monthlyFees * 12;
      
      onSubmit({
        ...formData,
        totalFees
      });
    }
  };

  // Generate grade options from 1 to 10
  const gradeOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Student Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`form-input mt-1 ${errors.name ? 'border-red-500' : ''}`}
          placeholder="Enter student name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`form-input mt-1 ${errors.phone ? 'border-red-500' : ''}`}
          placeholder="Enter phone number"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
          Grade
        </label>
        <select
          id="grade"
          name="grade"
          value={formData.grade}
          onChange={handleChange}
          className="form-input mt-1"
        >
          {gradeOptions.map(grade => (
            <option key={grade} value={grade}>
              {formatGrade(grade)} Grade
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {formData.grade >= 9 ? 'Yearly fee structure applies' : 'Monthly fee structure applies'}
        </p>
      </div>

      <div>
        <label htmlFor="batch" className="block text-sm font-medium text-gray-700">
          Batch
        </label>
        <input
          type="text"
          id="batch"
          name="batch"
          value={formData.batch}
          onChange={handleChange}
          className={`form-input mt-1 ${errors.batch ? 'border-red-500' : ''}`}
          placeholder="Enter batch"
        />
        {errors.batch && <p className="mt-1 text-sm text-red-500">{errors.batch}</p>}
      </div>

      {formData.grade >= 9 ? (
        <div>
          <label htmlFor="yearlyFees" className="block text-sm font-medium text-gray-700">
            Yearly Fees
          </label>
          <input
            type="number"
            id="yearlyFees"
            name="yearlyFees"
            value={formData.yearlyFees}
            onChange={handleChange}
            className={`form-input mt-1 ${errors.yearlyFees ? 'border-red-500' : ''}`}
            placeholder="Enter yearly fees"
            min="0"
          />
          {errors.yearlyFees && <p className="mt-1 text-sm text-red-500">{errors.yearlyFees}</p>}
        </div>
      ) : (
        <div>
          <label htmlFor="monthlyFees" className="block text-sm font-medium text-gray-700">
            Monthly Fees
          </label>
          <input
            type="number"
            id="monthlyFees"
            name="monthlyFees"
            value={formData.monthlyFees}
            onChange={handleChange}
            className={`form-input mt-1 ${errors.monthlyFees ? 'border-red-500' : ''}`}
            placeholder="Enter monthly fees"
            min="0"
          />
          {errors.monthlyFees && <p className="mt-1 text-sm text-red-500">{errors.monthlyFees}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Annual Total: ₹{formData.monthlyFees * 12}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
          value={formData.notes}
          onChange={handleChange}
          className="form-input mt-1"
          placeholder="Add any notes about the student"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          {student ? 'Update Student' : 'Add Student'}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
