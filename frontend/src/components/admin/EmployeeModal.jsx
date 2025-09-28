import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, MapPin, Building, Calendar, Clock, UserCheck, RotateCcw, Camera, Upload, CreditCard, FileText } from 'lucide-react';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';

const EmployeeModal = ({
  isOpen,
  onClose,
  onSave,
  employee = null,
  mode = 'create' // 'create' or 'edit'
}) => {
  const { primaryColor } = useCompanyTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    address: '',
    empCode: '',
    designation: 'security guard',
    category: 'semi-skilled',
    shift: 'Morning Shift (7:00 AM - 3:00 PM)',
    uanNumber: '',
    esicNumber: '',
    accountNumber: '',
    ifscCode: '',
    photo: null,
    active: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && employee) {
        setFormData({
          name: employee.name || '',
          email: employee.email || '',
          mobile: employee.mobile || '',
          password: '', // Leave empty for edit mode
          confirmPassword: '', // Leave empty for edit mode
          address: employee.address || '',
          empCode: employee.empCode || '',
          designation: employee.designation || 'security guard',
          category: employee.category || 'semi-skilled',
          shift: employee.shift || 'Morning Shift (7:00 AM - 3:00 PM)',
          uanNumber: employee.uanNumber || '',
          esicNumber: employee.esicNumber || '',
          accountNumber: employee.accountNumber || '',
          ifscCode: employee.ifscCode || '',
          photo: employee.photo || null,
          active: employee.active !== undefined ? employee.active : true
        });
        setPhotoPreview(employee.photo || null);
        setImagePreview(employee.photo || null);
      } else {
        setFormData({
          name: '',
          email: '',
          mobile: '',
          password: '',
          confirmPassword: '',
          address: '',
          empCode: '',
          designation: 'security guard',
          category: 'semi-skilled',
          shift: 'Morning Shift (7:00 AM - 3:00 PM)',
          uanNumber: '',
          esicNumber: '',
          accountNumber: '',
          ifscCode: '',
          photo: null,
          active: true
        });
        setPhotoPreview(null);
        setImagePreview(null);
      }
      setErrors({});
    }
  }, [isOpen, mode, employee]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          photo: 'File size must be less than 5MB'
        }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          photo: 'Please select an image file'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setPhotoPreview(imageUrl);
        setImagePreview(imageUrl);
        setFormData(prev => ({
          ...prev,
          photo: imageUrl
        }));
        setErrors(prev => ({
          ...prev,
          photo: ''
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const removePhoto = () => {
    setPhotoPreview(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      photo: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Switch camera
  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);

    // Stop current camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    // Start new camera with different facing mode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      alert('Unable to switch camera. Please check permissions.');
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {

          // Create object URL for preview
          const imageUrl = URL.createObjectURL(blob);
          setImagePreview(imageUrl);
          setPhotoPreview(imageUrl);

          // Update form data
          setFormData(prev => ({
            ...prev,
            photo: imageUrl
          }));

          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.empCode.trim()) {
      newErrors.empCode = 'Employee code is required';
    }

    if (!formData.uanNumber.trim()) {
      newErrors.uanNumber = 'UAN number is required';
    }

    if (!formData.esicNumber.trim()) {
      newErrors.esicNumber = 'ESIC number is required';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    }

    // Password validation
    if (mode === 'create') {
      if (!formData.password.trim()) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

    } else {
      // For edit mode, password is optional but if provided, must be valid
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose(); // Close modal on successful save
    } catch (error) {
      console.error("Modal save error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200" style={{ backgroundColor: primaryColor }}>
          <h2 className="text-xl font-semibold text-white">
            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee Code and Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="empCode" className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="empCode"
                name="empCode"
                value={formData.empCode}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.empCode ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter employee code"
              />
              {errors.empCode && <p className="mt-1 text-xs text-red-500">{errors.empCode}</p>}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
          </div>

          {/* Employee Photo Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee Photo</label>
            <div className="flex items-center space-x-6">

              {/* Camera Modal */}
              {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Take Photo</h3>
                      <button
                        onClick={stopCamera}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />

                      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                        <button
                          onClick={switchCamera}
                          className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Switch Camera
                        </button>
                        <button
                          onClick={capturePhoto}
                          className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capture
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Preview */}
              <div className="relative">
                {(photoPreview || imagePreview) ? (
                  <div className="relative">
                    <img
                      src={photoPreview || imagePreview}
                      alt="Employee photo"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Photo Actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            {/* Photo Instructions */}
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Take a clear photo using your device camera</p>
              <p>• Or upload an existing image file (JPEG, PNG)</p>
              <p>• Maximum file size: 5MB</p>
              <p>• Recommended size: 200x200 pixels</p>
            </div>
            {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
          </div>

          {/* Contact and Login Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter email address (optional)"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter password"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter mobile number"
              />
              {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter full address"
              />
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
            </div>
          </div>

          {/* Job and Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <select
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ladies guard">Ladies Guard</option>
                <option value="security guard">Security Guard</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="skilled">Skilled</option>
                <option value="semi-skilled">Semi Skilled</option>
                <option value="unskilled">Unskilled</option>
              </select>
            </div>

            <div>
              <label htmlFor="uanNumber" className="block text-sm font-medium text-gray-700 mb-2">
                UAN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="uanNumber"
                name="uanNumber"
                value={formData.uanNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.uanNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter UAN number"
              />
              {errors.uanNumber && <p className="mt-1 text-xs text-red-500">{errors.uanNumber}</p>}
            </div>

            <div>
              <label htmlFor="esicNumber" className="block text-sm font-medium text-gray-700 mb-2">
                ESIC Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="esicNumber"
                name="esicNumber"
                value={formData.esicNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.esicNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter ESIC number"
              />
              {errors.esicNumber && <p className="mt-1 text-xs text-red-500">{errors.esicNumber}</p>}
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter bank account number"
              />
              {errors.accountNumber && <p className="mt-1 text-xs text-red-500">{errors.accountNumber}</p>}
            </div>

            <div>
              <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ifscCode"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.ifscCode ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter IFSC code"
              />
              {errors.ifscCode && <p className="mt-1 text-xs text-red-500">{errors.ifscCode}</p>}
            </div>

            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-2">
                Shift <span className="text-red-500">*</span>
              </label>
              <select
                id="shift"
                name="shift"
                value={formData.shift}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Morning Shift (7:00 AM - 3:00 PM)">Morning Shift (7:00 AM - 3:00 PM)</option>
                <option value="Evening Shift (3:00 PM - 11:00 PM)">Evening Shift (3:00 PM - 11:00 PM)</option>
                <option value="Night Shift (11:00 PM - 7:00 AM)">Night Shift (11:00 PM - 7:00 AM)</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </div>
              ) : (
                mode === 'create' ? 'Save Employee' : 'Update Employee'
              )}
            </button>
          </div>
        </form>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default EmployeeModal;
