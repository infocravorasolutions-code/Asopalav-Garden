import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, MapPin, Clock, Building, UserPlus, Save, Loader2, Camera, Upload, RotateCcw } from 'lucide-react';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import { api, handleApiError } from '../../utils/fetchInterceptor';
import toast from 'react-hot-toast';

const EnhancedEmployeeModal = ({ isOpen, onClose, mode, employee, onSave }) => {
  const { primaryColor } = useCompanyTheme();
  const [loading, setLoading] = useState(false);
  
  // Site and point assignment state
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSitePoints, setSelectedSitePoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);

  // Photo-related state
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const [imagePreview, setImagePreview] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch sites when modal opens
  const fetchSites = async () => {
    setLoadingSites(true);
    try {
      console.log('Fetching sites...');
      const response = await api.get('/sites');
      
      if (Array.isArray(response.data)) {
        console.log('Sites fetched successfully (direct array):', response.data);
        setSites(response.data);
      } else if (response.data && response.data.success && response.data.data) {
        console.log('Sites fetched successfully (wrapped):', response.data.data);
        setSites(response.data.data || []);
      } else {
        console.error('Failed to fetch sites - response structure:', response.data);
        setSites([]);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      handleApiError(error, 'Failed to fetch sites');
      setSites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  // Fetch points for selected site
  const fetchSitePoints = async (siteId) => {
    if (!siteId) {
      setSelectedSitePoints([]);
      return;
    }

    setLoadingPoints(true);
    try {
      console.log('Fetching points for site:', siteId);
      const response = await api.get(`/sites/${siteId}`);
      
      if (response.data && response.data.points) {
        console.log('Site points fetched (direct object):', response.data.points);
        setSelectedSitePoints(response.data.points || []);
      } else if (response.data && response.data.success && response.data.data && response.data.data.points) {
        console.log('Site points fetched (wrapped):', response.data.data.points);
        setSelectedSitePoints(response.data.data.points || []);
      } else {
        console.error('Failed to fetch site points - response structure:', response.data);
        setSelectedSitePoints([]);
      }
    } catch (error) {
      console.error('Error fetching site points:', error);
      handleApiError(error, 'Failed to fetch site points');
      setSelectedSitePoints([]);
    } finally {
      setLoadingPoints(false);
    }
  };

  // Photo handling functions
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      try {
        // Compress the uploaded image
        const compressedBlob = await compressImage(file, 800, 600, 0.7);

        // Convert to base64 for storage
        const base64DataUrl = await blobToBase64(compressedBlob);

        // Create object URL for preview
        const imageUrl = URL.createObjectURL(compressedBlob);
        setPhotoPreview(imageUrl);
        setImagePreview(imageUrl);
        setFormData(prev => ({
          ...prev,
          photo: base64DataUrl
        }));
      } catch (error) {
        console.error('Error compressing uploaded image:', error);
        // Fallback to original file if compression fails
        const base64DataUrl = await blobToBase64(file);
        const imageUrl = URL.createObjectURL(file);
        setPhotoPreview(imageUrl);
        setImagePreview(imageUrl);
        setFormData(prev => ({
          ...prev,
          photo: base64DataUrl
        }));
      }
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
      setIsCameraActive(true);
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
      setIsCameraActive(false);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setIsCameraActive(false);
  };

  // Switch camera
  const switchCamera = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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
      // Don't show alert, just log the error to prevent form validation issues
      console.log('Camera switch failed, reverting to previous camera');
      // Revert to previous facing mode
      setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    }
  };

  // Compress image function
  const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Convert blob to base64 data URL
  const blobToBase64 = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  // Capture photo
  const capturePhoto = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob and compress
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // Compress the image
            const compressedBlob = await compressImage(blob, 800, 600, 0.7);

            // Convert to base64 for storage
            const base64DataUrl = await blobToBase64(compressedBlob);

            // Create object URL for preview
            const imageUrl = URL.createObjectURL(compressedBlob);
            setImagePreview(imageUrl);
            setPhotoPreview(imageUrl);

            // Update form data with compressed base64 image
            setFormData(prev => ({
              ...prev,
              photo: base64DataUrl
            }));

            stopCamera();
          } catch (error) {
            console.error('Error compressing image:', error);
            // Fallback to original blob if compression fails
            const base64DataUrl = await blobToBase64(blob);
            const imageUrl = URL.createObjectURL(blob);
            setImagePreview(imageUrl);
            setPhotoPreview(imageUrl);
            setFormData(prev => ({
              ...prev,
              photo: base64DataUrl
            }));
            stopCamera();
          }
        }
      }, 'image/jpeg', 0.8);
    }
  };

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
    assignedSite: '',
    assignedPoints: []
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch sites when modal opens
      fetchSites();

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
          assignedSite: employee.assignedSiteId || '',
          assignedPoints: employee.assignedPoints || []
        });
        setPhotoPreview(employee.photo || null);
        setImagePreview(employee.photo || null);
        
        // Fetch points for assigned site if exists
        if (employee.assignedSiteId) {
          fetchSitePoints(employee.assignedSiteId);
        }
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
          assignedSite: '',
          assignedPoints: []
        });
      }
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

  // Clean up image previews when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhotoPreview(null);
      setImagePreview(null);
      setShowCamera(false);
      setIsCameraActive(false);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
  }, [isOpen, cameraStream]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle site selection change
    if (name === 'assignedSite') {
      console.log('Site selection changed:', { name, value });
      setFormData(prev => ({
        ...prev,
        [name]: value,
        assignedPoints: [] // Clear selected points when site changes
      }));
      fetchSitePoints(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle point selection
  const handlePointToggle = (point) => {
    setFormData(prev => {
      const currentPoints = prev.assignedPoints || [];
      const isSelected = currentPoints.some(p => p.pointId === point._id);
      
      if (isSelected) {
        // Remove point
        return {
          ...prev,
          assignedPoints: currentPoints.filter(p => p.pointId !== point._id)
        };
      } else {
        // Add point
        return {
          ...prev,
          assignedPoints: [
            ...currentPoints,
            {
              pointId: point._id,
              pointName: point.name,
              pointCode: point.pointCode,
              isRequired: point.isRequired || false
            }
          ]
        };
      }
    });
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
    if (!formData.address.trim()) {
      toast.error('Address is required');
      return;
    }
    if (!formData.empCode.trim()) {
      toast.error('Employee code is required');
      return;
    }
    if (!formData.uanNumber.trim()) {
      toast.error('UAN number is required');
      return;
    }
    if (!formData.esicNumber.trim()) {
      toast.error('ESIC number is required');
      return;
    }
    if (!formData.accountNumber.trim()) {
      toast.error('Account number is required');
      return;
    }
    if (!formData.ifscCode.trim()) {
      toast.error('IFSC code is required');
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

    // Transform form data for backend compatibility
    const transformedData = {
      ...formData,
      // Map assignedSite to assignedSiteId
      assignedSiteId: formData.assignedSite || null,
      // Remove the frontend-specific field
      assignedSite: undefined
    };

    console.log('Manager EmployeeModal - Form submission data:', {
      name: transformedData.name,
      email: transformedData.email,
      assignedSiteId: transformedData.assignedSiteId,
      assignedPointsCount: transformedData.assignedPoints?.length || 0,
      formDataKeys: Object.keys(transformedData)
    });

    setLoading(true);
    try {
      await onSave(transformedData);
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
                    Employee Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="empCode"
                    value={formData.empCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter employee code"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Employee Photo Section */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Employee Photo
              </h3>
              
              <div className="flex items-center space-x-6">
                {/* Camera Modal */}
                {showCamera && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Take Photo</h3>
                        <button
                          type="button"
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
                            type="button"
                            onClick={switchCamera}
                            className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Switch Camera
                          </button>
                          <button
                            type="button"
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
                  {(photoPreview || imagePreview || formData.photo) ? (
                    <div className="relative">
                      <img
                        src={photoPreview || imagePreview || formData.photo}
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
              <div className="text-xs text-gray-600 space-y-1 mt-3">
                <p>• Take a clear photo using your device camera</p>
                <p>• Or upload an existing image file (JPEG, PNG)</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Recommended size: 200x200 pixels</p>
              </div>
            </div>

            {/* Job and Financial Details */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Job and Financial Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    Shift <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="active"
                    value={formData.active}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UAN Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="uanNumber"
                    value={formData.uanNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter UAN number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ESIC Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="esicNumber"
                    value={formData.esicNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter ESIC number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter bank account number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base sm:text-sm"
                    placeholder="Enter IFSC code"
                    required
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
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-base sm:text-sm"
                  rows="3"
                  placeholder="Enter address"
                  required
                />
              </div>
            </div>

            {/* Site Assignment */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                Work Site Assignment
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Site Assignment
                </label>
                <div className="relative">
                  <select
                    name="assignedSite"
                    value={formData.assignedSite}
                    onChange={handleInputChange}
                    disabled={loadingSites}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base sm:text-sm"
                  >
                    <option value="">Choose a work site</option>
                    {sites.length > 0 ? (
                      sites.map((site) => (
                        <option key={site._id} value={site._id}>
                          {site.name} ({site.siteCode})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No sites available</option>
                    )}
                  </select>
                  {loadingSites && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {loadingSites && (
                  <p className="text-sm text-gray-500 mt-1">Loading available sites...</p>
                )}
                {formData.assignedSite && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Site selected - Work points will be loaded below
                  </p>
                )}
              </div>

              {/* Point Assignment */}
              {formData.assignedSite && (
                <div className="mb-6">
                  {/* Header with Selection Counter */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Work Points Assignment</h4>
                        <p className="text-xs text-gray-500">Select work locations for this employee</p>
                      </div>
                    </div>
                    {formData.assignedPoints?.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {formData.assignedPoints.length} Selected
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Points Container */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 sm:p-6">
                    {loadingPoints ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200"></div>
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                        </div>
                        <span className="mt-3 text-sm font-medium text-gray-600">Loading work points...</span>
                      </div>
                    ) : selectedSitePoints.length > 0 ? (
                      <div className="space-y-4">
                        {/* Instruction */}
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Select Work Points</p>
                              <p className="text-xs text-gray-600 mt-1">Choose the specific work locations this employee will be responsible for</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Points Grid */}
                        <div className="grid gap-3">
                          {selectedSitePoints.map((point, index) => {
                            const isSelected = formData.assignedPoints?.some(p => p.pointId === point._id);
                            return (
                              <div 
                                key={point._id} 
                                className={`relative group transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-blue-50 border-blue-300 shadow-md' 
                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                } border-2 rounded-xl p-4 cursor-pointer`}
                                onClick={() => handlePointToggle(point)}
                              >
                                {/* Selection Indicator */}
                                <div className="absolute top-3 right-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    isSelected 
                                      ? 'bg-blue-600 border-blue-600' 
                                      : 'border-gray-300 group-hover:border-blue-400'
                                  }`}>
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Point Content */}
                                <div className="pr-8">
                                  {/* Point Name & Code */}
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                                        {point.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Code: {point.pointCode}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                      {point.isRequired && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          Required
                                        </span>
                                      )}
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        {point.pointType || 'checkpoint'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Description */}
                                  {point.description && (
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                      {point.description}
                                    </p>
                                  )}
                                  
                                  {/* Coordinates (for reference) */}
                                  <div className="mt-2 text-xs text-gray-400">
                                    <span className="inline-flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {point.coordinates?.latitude?.toFixed(6)}, {point.coordinates?.longitude?.toFixed(6)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.591" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">No Work Points Available</h3>
                        <p className="text-xs text-gray-500 mb-3">This site doesn't have any work points configured yet</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            💡 Contact your admin to add work points to this site
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

export default EnhancedEmployeeModal;
