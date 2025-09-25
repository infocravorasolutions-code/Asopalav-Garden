import React, { useEffect, useState, useRef } from "react";
import { Users, Edit, Trash2, X, Plus, User, MapPin, Calendar, Camera, Upload, RotateCcw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useManagerEmployee } from "../../contexts/ManagerEmployeeContext";
import { useOffline } from "../../hooks/useOffline";
import FeatureOfflinePage from "../offline/FeatureOfflinePage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { IMAGE_URL } from "../../services/api";

const MyEmployees = () => {
  const { user } = useAuth();
  const { employees, fetchMyEmployees, deleteMyEmployee, createMyEmployee, updateMyEmployee, loading } = useManagerEmployee();
  const { isOffline } = useOffline();

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchMyEmployees();
  }, [fetchMyEmployees]);

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
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
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
          const file = new File([blob], `employee-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedImage(file);
          setImagePreview(URL.createObjectURL(blob));
          stopCamera();
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
      email: form.email.value,
      password: form.password.value,
      mobile: form.mobile.value,
      address: form.address.value,
      managerId: user._id, // Manager's ID
      shift: form.shift.value,
      designation: form.designation.value,
      category: form.category.value,
      uan: form.uan.value,
      esic: form.esic.value,
      accountNo: form.accountNo.value,
      ifsc: form.ifsc.value,
      createdBy: user._id,
      isCreatedByAdmin: false // Manager creating employee
    };

    if (editData) {
      // For editing, include all fields from the form
      const updateData = {
        empCode: form.empCode.value,
        name: form.name.value,
        email: form.email.value,
        mobile: form.mobile.value,
        address: form.address.value,
        managerId: user._id,
        shift: form.shift.value,
        designation: form.designation.value,
        category: form.category.value,
        uan: form.uan.value,
        esic: form.esic.value,
        accountNo: form.accountNo.value,
        ifsc: form.ifsc.value,
        createdBy: user._id,
        isCreatedByAdmin: false
      };

      // Only include password if it's provided (for updates)
      if (form.password.value.trim()) {
        updateData.password = form.password.value;
      }

      // Debug: Log what's being sent
      // console.log('Updating employee with data:', updateData);
      
      if (selectedImage) {
        // If there's a new image, use FormData
        const formData = new FormData();
        Object.keys(updateData).forEach(key => {
          formData.append(key, updateData[key]);
        });
        formData.append('image', selectedImage);
        // console.log('Uploading image:', selectedImage.name, 'Size:', selectedImage.size);
        updateMyEmployee(editData._id, formData);
      } else {
        // If no new image, use regular object
        updateMyEmployee(editData._id, updateData);
      }
    } else {
      // For creating new employee
      // console.log('Creating employee with data:', data);
      // console.log('selectedImage:', selectedImage);
      
      if (selectedImage) {
        // If there's an image, use FormData
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
        formData.append('image', selectedImage);
        // console.log('Creating employee with image:', selectedImage.name, 'Size:', selectedImage.size);
        createMyEmployee(formData);
      } else {
        // If no image, use regular object
        createMyEmployee(data);
      }
    }
    setOpen(false);
    setEditData(null);
    resetImage();
  };

  // Show offline page if user is offline
  if (isOffline) {
    return (
      <FeatureOfflinePage
        featureName="Employee Management"
        onRetry={fetchMyEmployees}
        showCachedData={employees.length > 0}
        lastSyncTime={localStorage.getItem('lastEmployeeSync')}
      />
    );
  }

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
            </div>

            {/* Profile Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Employee Photo
              </label>
              
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
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Image Preview */}
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </button>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-manager"
                    />
                    <label
                      htmlFor="image-upload-manager"
                      className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              
              <div className="text-xs text-gray-500 space-y-1 mt-3">
                <p>• Take a clear photo using your device camera</p>
                <p>• Or upload an existing image file (JPEG, PNG)</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Recommended size: 200x200 pixels</p>
              </div>
            </div>

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
                  Password {editData ? "(Leave blank to keep current)" : <span className="text-red-500">*</span>}
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder={editData ? "Enter new password (optional)" : "Enter password"}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editData}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="mobile"
                  type="tel"
                  defaultValue={editData?.mobile || ""}
                  placeholder="Enter mobile number"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                defaultValue={editData?.address || ""}
                placeholder="Enter full address"
                rows="3"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Designation and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={() => setOpen(false)}
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
 
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading employees...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            No Employees Found
          </h3>
          <p className="text-secondary-600">
            Add your first team member to manage here.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full min-w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Category</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Shift</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
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
                          <div className="text-sm text-secondary-500">ID: {emp._id?.slice(-6)}</div>
                        </div>
                      </div>
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
                      <span className="text-sm">{emp.email || "N/A"}</span>
                    </td>
                    <td>
                      <span className="text-sm">{emp.mobile || "N/A"}</span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${
                        emp.shift === 'morning' ? 'badge-primary' :
                        emp.shift === 'evening' ? 'badge-secondary' :
                        emp.shift === 'night' ? 'badge-accent' :
                        'badge-outline'
                      }`}>
                        {emp.shift === "morning" && "Morning"}
                        {emp.shift === "evening" && "Evening"}
                        {emp.shift === "night" && "Night"}
                        {!emp.shift && "N/A"}
                      </span>
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
                          onClick={() => deleteMyEmployee(emp._id)}
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
    </div>
  );
};

export default MyEmployees;