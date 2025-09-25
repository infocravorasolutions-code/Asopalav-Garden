import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EditAttendanceModal = ({ isOpen, onClose, record, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    stepIn: '',
    stepOut: '',
    shift: '',
    status: '',
    address: '',
    note: ''
  });

  // Initialize form data when record changes
  useEffect(() => {
    if (record) {
      // Convert dates to local datetime-local format
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // console.log('Formatting date:', { 
        //   original: dateString, 
        //   date: date, 
        //   localString: date.toLocaleString(),
        //   isoString: date.toISOString()
        // });
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
        // console.log('Formatted result:', formatted);
        return formatted;
      };

      const newFormData = {
        stepIn: formatDateForInput(record.stepIn),
        stepOut: formatDateForInput(record.stepOut),
        shift: record.shift || '',
        status: record.status || 'present',
        address: record.address || '',
        note: record.note || ''
      };
      
      setFormData(newFormData);
      // console.log('Form data initialized with record:', record._id, newFormData);
    }
  }, [record]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.stepIn) {
      toast.error('Step In time is required');
      return;
    }

    if (!formData.shift) {
      toast.error('Shift is required');
      return;
    }

    // Validate that stepOut is after stepIn
    if (formData.stepOut && new Date(formData.stepOut) <= new Date(formData.stepIn)) {
      toast.error('Step Out time must be after Step In time');
      return;
    }

    try {
      // Ensure dates are properly formatted - convert local datetime to ISO string
      const submitData = {
        ...formData,
        stepIn: formData.stepIn ? new Date(formData.stepIn + ':00').toISOString() : undefined,
        stepOut: formData.stepOut ? new Date(formData.stepOut + ':00').toISOString() : undefined
      };
      
      await onSave(record._id, submitData);
      onClose();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Attendance Record</h2>
            <p className="text-sm text-gray-600 mt-1">
              Employee: {record.employeeId?.name || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Employee Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{record.employeeId?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{record.employeeId?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Manager:</span>
                <span className="ml-2 font-medium">{record.managerId?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  record.stepIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {record.stepIn ? 'Present' : 'Present'}
                </span>
              </div>
            </div>
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Step In Time *
              </label>
              <input
                type="datetime-local"
                name="stepIn"
                value={formData.stepIn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Step Out Time
              </label>
              <input
                type="datetime-local"
                name="stepOut"
                value={formData.stepOut}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if employee hasn't clocked out</p>
            </div>
          </div>

          {/* Shift and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Shift *
              </label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Shift</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="weekoff">Week Off</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Location
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter location or address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Note
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder="Add any additional notes..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Debug Info - Remove after testing */}
          {/* <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>Original Step In: {record.stepIn}</div>
              <div>Original Step Out: {record.stepOut}</div>
              <div>Form Step In: {formData.stepIn}</div>
              <div>Form Step Out: {formData.stepOut}</div>
              <div>Local Step In: {record.stepIn ? new Date(record.stepIn).toLocaleString() : 'N/A'}</div>
              <div>Local Step Out: {record.stepOut ? new Date(record.stepOut).toLocaleString() : 'N/A'}</div>
            </div>
          </div> */}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center order-1 sm:order-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAttendanceModal;
