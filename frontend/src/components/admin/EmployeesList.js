import React, { useEffect, useState, useRef, useMemo } from "react";
import { Users, Edit, Trash2, X, Plus, User, MapPin, Camera, Upload, RotateCcw, CameraOff, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useManager } from "../../contexts/ManagerContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { IMAGE_URL } from "../../services/api";

const EmployeeList = () => {
  const { user } = useAuth();
  const { employees, fetchEmployees, deleteEmployee, createEmployee, updateEmployee, employeeLoading } = useEmployee();
  const { managers, fetchManagers } = useManager();

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const [cameraLoading, setCameraLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Debounced search to reduce processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Always fetch employees when component mounts
    fetchEmployees();
    
    // Fetch managers if not already loaded
    if (managers?.length === 0) {
      fetchManagers();
    }
  }, []);

  // Optimized filter employees with debounced search
  const filteredEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    
    return employees.filter(emp => {
      if (!debouncedSearchTerm) return true;
      
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(searchLower) ||
        emp.empCode?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.designation?.toLowerCase().includes(searchLower) ||
        emp.category?.toLowerCase().includes(searchLower) ||
        emp.mobile?.toLowerCase().includes(searchLower) ||
        emp?.managerId?.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [employees, debouncedSearchTerm]);

  // Paginated data for better performance
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset image when dialog opens/closes
  const resetImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setShowCamera(false);
    stopCamera();
  };

  // Start camera
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      // console.log('Starting camera...');
      // console.log('Facing mode:', facingMode);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // console.log('Camera stream obtained:', stream);
      setCameraStream(stream);
      
      // Show camera modal first, then set up video
      setShowCamera(true);
      // console.log('Camera modal should be visible now');
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        // console.log('Camera loading timeout - forcing stop loading');
        setCameraLoading(false);
      }, 10000); // 10 seconds timeout
      
      // Wait for video element to be available
      const setupVideo = () => {
        if (videoRef.current) {
          // console.log('Setting video srcObject');
          videoRef.current.srcObject = stream;
          
          // Set up event listeners
          videoRef.current.onloadedmetadata = () => {
            // console.log('Video metadata loaded');
            // console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            clearTimeout(timeoutId);
            
            // Try to play after metadata is loaded
            videoRef.current.play().then(() => {
              // console.log('Video started playing after metadata loaded');
              setCameraLoading(false);
            }).catch(error => {
              console.error('Error playing video after metadata:', error);
              setCameraLoading(false);
            });
          };
          
          videoRef.current.oncanplay = () => {
            // console.log('Video can play');
          };
          
          videoRef.current.onerror = (error) => {
            console.error('Video error:', error);
            clearTimeout(timeoutId);
            setCameraLoading(false);
          };
          
          // Try to play immediately
          videoRef.current.play().then(() => {
            // console.log('Video started playing immediately');
            setCameraLoading(false);
          }).catch(error => {
            // console.log('Immediate play failed, waiting for metadata:', error);
            // The onLoadedMetadata handler will try again
          });
        } else {
          // console.log('Video ref not ready yet, retrying...');
          setTimeout(setupVideo, 100);
        }
      };
      
      // Start trying to set up video
      setupVideo();
      
      // Fallback: ensure video plays after a short delay
      setTimeout(() => {
        if (videoRef.current && cameraLoading) {
          // console.log('Fallback: trying to play video');
          videoRef.current.play().then(() => {
            // console.log('Fallback: video playing successfully');
            setCameraLoading(false);
          }).catch(error => {
            console.error('Fallback: video play failed:', error);
            setCameraLoading(false);
          });
        }
      }, 2000);
      
      // Additional fallback with longer delay
      setTimeout(() => {
        if (videoRef.current && cameraLoading) {
          // console.log('Second fallback: forcing video play');
          setCameraLoading(false);
          // Force the video to show even if play() fails
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {
              // console.log('Forced play also failed, but showing video anyway');
            });
          }
        }
      }, 5000);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraLoading(false);
      
      let errorMessage = 'Unable to access camera. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
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
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  // Capture photo
  const capturePhoto = () => {
    // console.log('Capture photo function called');
    // console.log('Video ref:', videoRef.current);
    // console.log('Canvas ref:', canvasRef.current);
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      // console.log('Video readyState:', video.readyState);
      // console.log('Video paused:', video.paused);

      // Check if video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video has no dimensions - cannot capture');
        alert('Camera not ready. Please wait a moment and try again.');
        return;
      }

      // Check if video is playing
      if (video.paused) {
        console.error('Video is paused - cannot capture');
        alert('Camera is not active. Please wait for the camera to start.');
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        // console.log('Canvas toBlob callback executed');
        // console.log('Blob created:', blob);
        
        if (blob) {
          // console.log('Creating file from blob');
          const file = new File([blob], `employee-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          // console.log('File created:', file);
          setSelectedImage(file);
          setImagePreview(URL.createObjectURL(blob));
          // console.log('Image preview set, stopping camera');
          stopCamera();
        } else {
          console.error('Failed to create blob from canvas');
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    
    // Prepare the data object
      const data = {
        empCode: form.empCode.value,
        name: form.name.value,
        designation: form.designation.value,
        category: form.category.value,
        uan: form.uan.value,
        esic: form.esic.value,
        accountNo: form.accountNo.value,
        ifsc: form.ifsc.value,
        email: form.email.value,
        password: form.password.value,
        mobile: form.mobile.value,
        address: form.address.value,
        managerId: form.managerId.value,
        shift: form.shift.value,
        createdBy: user._id,
        isCreatedByAdmin: user.userType === 'admin'
      };

    if (editData) {
      // For editing, include all fields from the form
      const updateData = {
        empCode: form.empCode.value,
        name: form.name.value,
        designation: form.designation.value,
        category: form.category.value,
        uan: form.uan.value,
        esic: form.esic.value,
        accountNo: form.accountNo.value,
        ifsc: form.ifsc.value,
        email: form.email.value,
        password: form.password.value,
        mobile: form.mobile.value,
        address: form.address.value,
        managerId: form.managerId.value,
        shift: form.shift.value,
        createdBy: user._id,
        isCreatedByAdmin: user.userType === 'admin'
      };

      // Only include email if it's provided
      if (!form.email.value) {
        delete updateData.email;
      }

      // Only include mobile if it's provided
      if (!form.mobile.value) {
        delete updateData.mobile;
      }

      // Only include managerId if it's provided
      if (!form.managerId.value) {
        delete updateData.managerId;
      }
      
      if (selectedImage) {
        // If there's a new image, use FormData
        const formData = new FormData();
        Object.keys(updateData).forEach(key => {
          formData.append(key, updateData[key]);
        });
        formData.append('image', selectedImage);
        updateEmployee(editData._id, formData);
      } else {
        // If no new image, use regular object
        updateEmployee(editData._id, updateData);
      }
    } else {
      // For creating new employee
      if (selectedImage) {
        // If there's an image, use FormData
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
        formData.append('image', selectedImage);
        createEmployee(formData);
      } else {
        // If no image, use regular object
        createEmployee(data);
      }
    }
    setOpen(false);
    setEditData(null);
    resetImage();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {user?.role === "supervisor" ? "My Team" : "My Employees"}
          </h1>
          <p className="text-secondary-600">
            Total{" "}
            <span className="text-[red] font-bold">{employees.length || 0}</span>{" "}
            Employees.
            {searchTerm && (
              <span className="ml-2">
                Showing{" "}
                <span className="text-blue-600 font-bold">{filteredEmployees.length}</span>{" "}
                results for "{searchTerm}"
              </span>
            )}
          </p>
        </div>
        {/* Add Employee Button */}
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => {
            setEditData(null);
            resetImage();
            setOpen(true);
          }}
        >
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees by name, code, email, designation, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {/* <div className="mt-2 text-sm text-secondary-500">
          Search across employee name, employee code, email, designation, category, mobile number, and assigned manager.
        </div> */}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>

        <DialogContent className="max-w-2xl w-[95%] sm:w-[600px] max-h-[85vh] overflow-y-auto bg-white rounded-xl p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex justify-between items-center">
              {editData ? "Edit Employee" : "Add Employee"}
              <X
                className="cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  resetImage();
                }}
              />
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Employee Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="empCode"
                  defaultValue={editData?.empCode || ""}
                  placeholder="Enter employee code"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={editData?.name || ""}
                  placeholder="Enter full name"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Designation <span className="text-red-500">*</span>
                </label>
                <select
                  name="designation"
                  defaultValue={editData?.designation || "securityOfficer"}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="securityOfficer">Security Officer</option>
                  <option value="ladiesGuard">Ladies Guard</option>
                  <option value="securityGuard">Security Guard</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  defaultValue={editData?.category || "semiSkilled"}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="skilled">Skilled</option>
                  <option value="semiSkilled">Semi Skilled</option>
                  <option value="unSkilled">Unskilled</option>
                </select>
              </div>
            </div>

            {/* Profile Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Employee Photo
              </label>
              

              
              <div className="flex items-center space-x-4">
                {/* Image Preview */}
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : editData?.image ? (
                    <img 
                      src={`${IMAGE_URL}/${editData.image}`} 
                      alt={editData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                
                {/* Upload Buttons */}
                <div className="flex-1 space-y-2">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        // console.log('Take Photo button clicked for profile image');
                        startCamera();
                      }}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </button>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </label>
                  </div>
                  
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Take a clear photo using your device camera</p>
                <p>• Or upload an existing image file (JPEG, PNG)</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Recommended size: 200x200 pixels</p>
              </div>
            </div>

            {/* Government IDs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  UAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="uan"
                  defaultValue={editData?.uan || ""}
                  placeholder="Enter UAN number"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  ESIC Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="esic"
                  defaultValue={editData?.esic || ""}
                  placeholder="Enter ESIC number"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="accountNo"
                  defaultValue={editData?.accountNo || ""}
                  placeholder="Enter bank account number"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="ifsc"
                  defaultValue={editData?.ifsc || ""}
                  placeholder="Enter IFSC code"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editData?.email || ""}
                  placeholder="Enter email address (optional)"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password {!editData && <span className="text-red-500">*</span>}
                </label>
                <input
                  name="password"
                  type="password"
                  defaultValue={editData?.password || ""}
                  placeholder="Enter password"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editData}
                  minLength="6"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  name="mobile"
                  type="tel"
                  defaultValue={editData?.mobile || ""}
                  placeholder="Enter mobile number"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                defaultValue={editData?.address || ""}
                placeholder="Enter full address"
                rows="2"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Assigned Manager
              </label>
              <select
                name="managerId"
                defaultValue={editData?.managerId?._id || ""}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Manager</option>
                {managers.map((manager) => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Shift <span className="text-red-500">*</span>
              </label>
              <select
                name="shift"
                defaultValue={editData?.shift || "morning"}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="morning">Morning Shift (7:00 AM - 3:00 PM)</option>
                <option value="evening">Evening Shift (3:00 PM - 11:00 PM)</option>
                <option value="night">Night Shift (11:00 PM - 7:00 AM)</option>
              </select>
            </div>



            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  resetImage();
                }}
                className="w-full sm:w-auto border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editData ? "Update Employee" : "Save Employee"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      {/* Employee Table */}
      {employeeLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading employees...</span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            {searchTerm ? "No Employees Found" : "No Employees Found"}
          </h3>
          <p className="text-secondary-600">
            {searchTerm 
              ? `No employees match your search for "${searchTerm}". Try a different search term.`
              : "Add your first team member to manage here."
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Emp Code</th>
                  <th>Designation</th>
                  <th>Category</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Manager</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center">
                            {emp.image ? (
                              <img 
                                src={`${IMAGE_URL}/${emp.image}`} 
                                alt={emp.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-secondary-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-sm text-secondary-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-secondary-600">{emp.empCode || "N/A"}</span>
                    </td>
                    <td>
                      <span className="text-sm">{emp.designation || "N/A"}</span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${
                        emp.category === 'skilled' ? 'badge-primary' :
                        emp.category === 'semiSkilled' ? 'badge-secondary' :
                        emp.category === 'unSkilled' ? 'badge-accent' :
                        'badge-outline'
                      }`}>
                        {emp.category || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">{emp.email}</span>
                    </td>
                    <td>
                      <span className="text-sm">{emp.mobile || "N/A"}</span>
                    </td>
                    <td>
                      <span className="text-sm">{emp?.managerId?.name || "Unassigned"}</span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditData(emp);
                            resetImage();
                            setOpen(true);
                          }}
                          className="btn btn-ghost btn-xs"
                          title="Edit Employee"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteEmployee(emp._id)}
                          className="btn btn-ghost btn-xs"
                          title="Delete Employee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Pagination Controls for Employees */}
      {filteredEmployees.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Pagination Info and Controls */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Showing
                </span>
                <span className="text-sm font-bold text-green-600">
                  {((currentPage - 1) * itemsPerPage) + 1}
                </span>
                <span className="text-sm text-gray-500">to</span>
                <span className="text-sm font-bold text-green-600">
                  {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
                </span>
                <span className="text-sm text-gray-500">of</span>
                <span className="text-sm font-bold text-green-600">
                  {filteredEmployees.length}
                </span>
                <span className="text-sm text-gray-500">employees</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="select select-bordered select-sm bg-white border-green-300 focus:border-green-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
            
            {/* Pagination Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                {/* First Page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="btn btn-outline btn-sm hover:btn-success"
                      title="First page"
                    >
                      ««
                    </button>
                    {currentPage > 4 && <span className="text-gray-400">...</span>}
                  </>
                )}
                
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm hover:btn-success disabled:opacity-50"
                  title="Previous page"
                >
                  «
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`btn btn-sm ${
                          currentPage === pageNum 
                            ? 'btn-success text-white' 
                            : 'btn-outline hover:btn-success'
                        }`}
                        title={`Page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline btn-sm hover:btn-success disabled:opacity-50"
                  title="Next page"
                >
                  »
                </button>
                
                {/* Last Page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="btn btn-outline btn-sm hover:btn-success"
                      title="Last page"
                    >
                      »»
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Quick Jump to Page */}
          {totalPages > 10 && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-gray-600">Jump to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                    setCurrentPage(page);
                  }}
                  className="input input-bordered input-sm w-20 text-center"
                />
                <span className="text-sm text-gray-500">of {totalPages}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Modal - Outside Dialog */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
              {cameraLoading ? (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Starting camera...</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                  style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
                  onLoadStart={() => {
                    // console.log('Video load started');
                  }}
                  onLoadedData={() => {
                    // console.log('Video data loaded');
                  }}
                  onLoadedMetadata={() => {
                    // console.log('Video metadata loaded in render');
                    if (videoRef.current) {
                      videoRef.current.play().then(() => {
                        // console.log('Video playing successfully in render');
                        setCameraLoading(false);
                      }).catch(error => {
                        console.error('Error playing video in render:', error);
                        setCameraLoading(false);
                      });
                    }
                  }}
                  onCanPlay={() => {
                    // console.log('Video can play in render');
                  }}
                  onCanPlayThrough={() => {
                    // console.log('Video can play through in render');
                  }}
                  onError={(e) => {
                    console.error('Video error in render:', e);
                    setCameraLoading(false);
                  }}
                />
              )}
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={switchCamera}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Switch Camera
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;