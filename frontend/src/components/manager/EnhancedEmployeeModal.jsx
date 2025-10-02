import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Clock, Building, UserPlus, Save, Loader2, Camera, Upload } from 'lucide-react';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import toast from 'react-hot-toast';

const EnhancedEmployeeModal = ({ isOpen, onClose, mode, employee, onSave }) => {
  const { primaryColor } = useCompanyTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    address: '',
    empCode: '',
    designation: 'gardener',
    category: 'semi-skilled',
    shift: 'Morning Shift (7:00 AM - 3:00 PM)',
    uanNumber: '',
    esicNumber: '',
    accountNumber: '',
    ifscCode: '',
    photo: null,
    active: true,
    status: 'Active'
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && employee) {
        setFormData({
          name: employee.name || '',
          email: employee.email || '',
          mobile: employee.mobile || '',
          password: '', // Leave empty for edit mode
          confirmPassword: '',
          address: employee.address || '',
          empCode: employee.empCode || '',
          designation: employee.designation || 'gardener',
          category: employee.category || 'semi-skilled',
          shift: employee.shift || 'Morning Shift (7:00 AM - 3:00 PM)',
          uanNumber: employee.uanNumber || '',
          esicNumber: employee.esicNumber || '',
          accountNumber: employee.accountNumber || '',
          ifscCode: employee.ifscCode || '',
          photo: employee.photo || null,
          active: employee.active !== undefined ? employee.active : true,
          status: employee.active ? 'Active' : 'Inactive'
        });
      } else {
        setFormData({
          name: '',
          email: '',
          mobile: '',
          password: '',
          confirmPassword: '',
          address: '',
          empCode: '',
          designation: 'gardener',
          category: 'semi-skilled',
          shift: 'Morning Shift (7:00 AM - 3:00 PM)',
          uanNumber: '',
          esicNumber: '',
          accountNumber: '',
          ifscCode: '',
          photo: null,
          active: true,
          status: 'Active'
        });
      }
    }
  }, [isOpen, mode, employee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!formData.mobile.trim()) {
      toast.error('Mobile number is required');
      return;
    }

    // Password validation for create mode
    if (mode === 'create') {
      if (!formData.password.trim()) {
        toast.error('Password is required');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      toast.success(`${mode === 'create' ? 'Employee created' : 'Employee updated'} successfully!`);
    } catch {
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} employee`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[98vh] sm:h-[95vh] md:h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 rounded-t-2xl text-white flex-shrink-0">
          <div className="flex items-start sm:items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-xl flex-shrink-0">
                {mode === 'create' ? <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" /> : <User className="h-5 w-5 sm:h-6 sm:w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                  {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm md:text-base truncate">
                  {mode === 'create' ? 'Create a new team member' : 'Update employee information'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                {mode === 'create' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                        placeholder="Enter password"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                        placeholder="Confirm password"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    name="empCode"
                    value={formData.empCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter employee code"
                  />
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Work Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter position/role"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift
                  </label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                  >
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
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Job Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                  >
                    <option value="gardener">Gardener</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                  >
                    <option value="skilled">Skilled</option>
                    <option value="semi-skilled">Semi Skilled</option>
                    <option value="unskilled">Unskilled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift
                  </label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                  >
                    <option value="Morning Shift (7:00 AM - 3:00 PM)">Morning Shift (7:00 AM - 3:00 PM)</option>
                    <option value="Evening Shift (3:00 PM - 11:00 PM)">Evening Shift (3:00 PM - 11:00 PM)</option>
                    <option value="Night Shift (11:00 PM - 7:00 AM)">Night Shift (11:00 PM - 7:00 AM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Financial Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UAN Number
                  </label>
                  <input
                    type="text"
                    name="uanNumber"
                    value={formData.uanNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter UAN number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ESIC Number
                  </label>
                  <input
                    type="text"
                    name="esicNumber"
                    value={formData.esicNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter ESIC number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Address Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-base sm:text-sm"
                  rows="3"
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center text-sm sm:text-base"
                style={{ backgroundColor: loading ? undefined : primaryColor }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Create Employee' : 'Update Employee'}
                  </>
                )}
              </button>
            </div>
          </form>
          {/* Add bottom padding to ensure content is fully visible */}
          <div className="h-4 sm:h-6"></div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEmployeeModal;
