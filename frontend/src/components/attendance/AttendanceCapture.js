import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check, X, MapPin, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { getApiUrl } from '../../config/apiConfig';
import locationService from '../../services/locationService';
import toast from 'react-hot-toast';

const AttendanceCapture = ({ onClose, employeeId, managerId, type = 'clock-in' }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking', 'valid', 'invalid', 'error'
  const [locationData, setLocationData] = useState(null);
  const [geoFenceValidation, setGeoFenceValidation] = useState(null);
  const [address, setAddress] = useState('Getting location...');
  const webcamRef = useRef(null);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
  };


  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const submitAttendance = async () => {
    if (!capturedImage) {
      toast.error('Please capture a photo first');
      return;
    }

    if (locationStatus !== 'valid') {
      toast.error('Cannot mark attendance: Location validation required');
      return;
    }

    if (!locationData || !geoFenceValidation) {
      toast.error('Location data not available. Please try again.');
      return;
    }

    try {
      setLoading(true);

      console.log('🔔 [AttendanceCapture] Submitting attendance with geo-fencing...');

      // Prepare attendance data with geo-fencing information
      const attendanceData = {
        employeeId,
        managerId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: address,
        shift: 'morning', // You can make this dynamic based on current time
        note: `Geo-fenced attendance from ${geoFenceValidation.nearestPoint}`,
        status: 'present'
      };

      console.log('📝 [AttendanceCapture] Attendance data prepared:', attendanceData);

      // Create FormData for image upload
      const formData = new FormData();

      // Convert base64 to blob
      const base64Data = capturedImage.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());

      // Create file from blob
      const file = new File([blob], `attendance_${employeeId}_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      // Add image to form data
      formData.append('stepInImage', file);

      // Add other data to form data
      Object.keys(attendanceData).forEach(key => {
        formData.append(key, attendanceData[key]);
      });

      // Submit attendance (step-in)
      const response = await fetch(`${getApiUrl()}/attendence/step-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Attendance marked successfully!');

        // Update location service with successful attendance
        locationService.forceLocationUpdate();

        console.log('✅ [AttendanceCapture] Attendance submitted successfully:', result);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to mark attendance');
      }

    } catch (error) {
      console.error('❌ [AttendanceCapture] Attendance submission error:', error);

      if (error.message.includes('Location outside designated area')) {
        toast.error('❌ Cannot mark attendance: You are outside the designated work area');
      } else if (error.message.includes('coordinates are required')) {
        toast.error('❌ Location information is required for attendance');
      } else {
        toast.error('❌ Failed to mark attendance. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render location status component
  const renderLocationStatus = () => {
    return (
      <div className="p-4 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {locationStatus === 'checking' && (
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                <Loader className="h-4 w-4 text-yellow-600 animate-spin" />
              </div>
            )}
            {locationStatus === 'valid' && (
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            )}
            {locationStatus === 'invalid' && (
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            )}
            {locationStatus === 'error' && (
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                <MapPin className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-900">
                {locationStatus === 'checking' && 'Checking Location...'}
                {locationStatus === 'valid' && 'Location Approved'}
                {locationStatus === 'invalid' && 'Location Not Allowed'}
                {locationStatus === 'error' && 'Location Unavailable'}
              </span>

              {locationStatus === 'valid' && geoFenceValidation && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Within Work Area
                </span>
              )}
              {locationStatus === 'invalid' && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Outside Work Area
                </span>
              )}
            </div>

            <p className="text-xs text-secondary-600 truncate">
              <MapPin className="inline h-3 w-3 mr-1" />
              {address}
            </p>


          </div>

          {locationStatus === 'error' && (
            <button
              onClick={checkLocationAndGeoFence}
              className="flex-shrink-0 px-3 py-1 text-xs bg-secondary-100 text-secondary-700 rounded-md hover:bg-secondary-200"
            >
              Retry
            </button>
          )}
        </div>

        {locationStatus === 'invalid' && geoFenceValidation && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              {geoFenceValidation.reason}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Please move to the designated work area to mark attendance.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900">
            {type === 'clock-in' ? '🔔 Clock In' : '🔔 Clock Out'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Location Status */}
        {renderLocationStatus()}

        {/* Camera/Image Content */}
        <div className="relative">
          {!capturedImage ? (
            <div className="relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-48 md:h-64 object-cover"
              />

              {/* Camera Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={switchCamera}
                  className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg"
                >
                  <RotateCcw className="h-5 w-5 text-secondary-700" />
                </button>

                <button
                  onClick={capture}
                  className="p-4 bg-primary-600 rounded-full shadow-lg hover:bg-primary-700"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured attendance"
                className="w-full h-48 md:h-64 object-cover"
              />

              {/* Image Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={retake}
                  className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg"
                >
                  <RotateCcw className="h-5 w-5 text-secondary-700" />
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!loading && locationStatus === 'valid') {
                      submitAttendance();
                    }
                  }}
                  disabled={loading || locationStatus !== 'valid'}
                  className={`p-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${locationStatus === 'valid'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-400'
                    }`}
                  title={locationStatus !== 'valid' ? 'Location validation required' : 'Submit attendance'}
                >
                  {loading ? (
                    <div className="loading-spinner h-6 w-6 border-white"></div>
                  ) : (
                    <Check className="h-6 w-6 text-white" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-3 md:p-4 bg-secondary-50">
          <p className="text-xs md:text-sm text-secondary-600 text-center">
            {locationStatus === 'checking' ? (
              'Verifying your location for geo-fenced attendance...'
            ) : locationStatus === 'valid' ? (
              !capturedImage
                ? '✅ Location verified! Position your face in the camera and tap to capture'
                : 'Review your photo and tap the check button to confirm attendance'
            ) : locationStatus === 'invalid' ? (
              '❌ You must be in the designated work area to mark attendance'
            ) : (
              '⚠️ Location verification failed. Please check your location settings.'
            )}
          </p>

          {locationStatus === 'valid' && geoFenceValidation?.area && (
            <p className="text-xs text-green-600 text-center mt-1">
              📍 {geoFenceValidation.area.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCapture;
