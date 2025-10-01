import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Camera,
    Check,
    X,
    RotateCcw,
    Upload,
    Loader2,
    MapPin,
    AlertCircle,
    Clock
} from 'lucide-react';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';
import { getLocationWithAutoFallback } from '../../utils/locationUtils';

const StepInModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);

    // State
    const [capturedImage, setCapturedImage] = useState(null);
    const [facingMode, setFacingMode] = useState('user');
    const [cameraReady, setCameraReady] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [location, setLocation] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    // Video constraints
    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode
    };

    // Auto-detect shift based on current time
    const getCurrentShift = () => {
        const now = new Date();
        const hour = now.getHours();

        // Morning: 7 AM - 3 PM (7-14)
        if (hour >= 7 && hour < 15) {
            return 'morning';
        }
        // Evening: 2 PM - 10 PM (14-22)
        else if (hour >= 14 && hour < 22) {
            return 'evening';
        }
        // Night: 10 PM - 7 AM (22-7)
        else {
            return 'night';
        }
    };

    // Get current location with fallback
    const getCurrentLocation = useCallback(async () => {
        setLocationLoading(true);
        try {
            const locationData = await getLocationWithAutoFallback();
            
            setCurrentLocation({ 
                latitude: locationData.latitude, 
                longitude: locationData.longitude 
            });
            setLocation(locationData.address);

            if (locationData.isFallback) {
                toast.success('Using default location (Ahmedabad, Gujarat)');
                console.log('Using fallback location:', locationData.address);
            } else {
                toast.success('Location captured successfully!');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            // Even if there's an error, use the fallback
            const fallbackData = {
                latitude: 23.0341367,
                longitude: 72.5723255,
                address: 'Ahmedabad, Gujarat, India (Default)'
            };
            setCurrentLocation({ 
                latitude: fallbackData.latitude, 
                longitude: fallbackData.longitude 
            });
            setLocation(fallbackData.address);
            toast.success('Using default location (Ahmedabad, Gujarat)');
        } finally {
            setLocationLoading(false);
        }
    }, []);

    // Auto-get location when modal opens
    useEffect(() => {
        if (isOpen) {
            getCurrentLocation();
        }
    }, [isOpen, getCurrentLocation]);

    // Capture photo
    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
            setImageLoading(true);
        }
    }, []);

    // Retake photo
    const retake = useCallback(() => {
        setCapturedImage(null);
        setImageLoading(false);
    }, []);

    // Switch camera
    const switchCamera = useCallback(() => {
        setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    }, [facingMode]);

    // Handle file select
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUri = e.target?.result;
            setCapturedImage(dataUri);
            setImageLoading(true);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!capturedImage) {
            toast.error('Please capture a photo first');
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert base64 image to File object
            const base64Data = capturedImage.split(',')[1];
            const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
            const file = new File([blob], `stepin_${Date.now()}.jpg`, {
                type: 'image/jpeg',
            });

            const stepInData = {
                stepInImage: file,
                address: location || 'Current Location',
                shift: getCurrentShift(), // Auto-detect shift based on current time
                status: 'present', // Always present for step-in
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                stepOut: null
            };

            await onSubmit(stepInData);
            handleClose();
        } catch (error) {
            console.error('Error submitting step-in:', error);
            toast.error('Failed to submit step-in');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle close
    const handleClose = () => {
        setCapturedImage(null);
        setLocation('');
        setCurrentLocation(null);
        setImageLoading(false);
        setCameraReady(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-1">
            <div className="bg-white rounded-xl w-full max-w-2xl mx-1 max-h-[98vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Step In - Clock In
                        </h3>
                        <p className="text-sm text-gray-600">Capture photo and enter details</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-manipulation min-h-[44px]"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Camera/Image Content */}
                <div className="p-3 sm:p-4 lg:p-6">
                    <div className="relative mb-4 sm:mb-6">
                        {!capturedImage ? (
                            <div className="relative">
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={videoConstraints}
                                    className="w-full h-80 object-cover rounded-lg"
                                    onUserMedia={() => setCameraReady(true)}
                                />

                                {/* Camera Controls */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                                    <button
                                        onClick={switchCamera}
                                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white touch-manipulation min-h-[44px]"
                                    >
                                        <RotateCcw className="h-5 w-5 text-gray-700" />
                                    </button>

                                    <button
                                        onClick={capture}
                                        disabled={!cameraReady}
                                        className="p-4 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 touch-manipulation min-h-[44px]"
                                    >
                                        <Camera className="h-6 w-6 text-white" />
                                    </button>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white touch-manipulation min-h-[44px]"
                                    >
                                        <Upload className="h-5 w-5 text-gray-700" />
                                    </button>
                                </div>

                                {!cameraReady && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                        <div className="flex flex-col items-center gap-2 text-white">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <p className="text-sm">Initializing camera...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={capturedImage}
                                    alt="Captured attendance"
                                    className="w-full h-80 object-cover rounded-lg"
                                    onLoad={() => setImageLoading(false)}
                                />

                                {/* Image Controls */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                                    <button
                                        onClick={retake}
                                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white touch-manipulation min-h-[44px]"
                                    >
                                        <RotateCcw className="h-5 w-5 text-gray-700" />
                                    </button>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || loading}
                                        className="p-4 bg-green-600 rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50 touch-manipulation min-h-[44px]"
                                    >
                                        {isSubmitting || loading ? (
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        ) : (
                                            <Check className="h-6 w-6 text-white" />
                                        )}
                                    </button>
                                </div>

                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    {capturedImage && (
                        <div className="space-y-4">
                            {/* Auto-detected Shift Display */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Detected Shift</p>
                                        <p className="text-lg font-semibold text-blue-700 capitalize">
                                            {getCurrentShift()} Shift
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            {getCurrentShift() === 'morning' && '7 AM - 3 PM'}
                                            {getCurrentShift() === 'evening' && '2 PM - 10 PM'}
                                            {getCurrentShift() === 'night' && '10 PM - 7 AM'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                    <span className="text-blue-600 text-xs ml-1">(Optional - will auto-detect from GPS)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter your current location or leave empty for auto-detection..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                                    />
                                    <button
                                        onClick={getCurrentLocation}
                                        disabled={locationLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 touch-manipulation min-h-[44px]"
                                    >
                                        {locationLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <MapPin className="h-4 w-4" />
                                        )}
                                        {locationLoading ? 'Getting...' : 'Get Location'}
                                    </button>
                                </div>
                                {currentLocation && (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <Check className="h-3 w-3" />
                                        Location captured: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation min-h-[44px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 touch-manipulation min-h-[44px]"
                                >
                                    {isSubmitting || loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Submit Step In
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                />
            </div>
        </div>
    );
};

export default StepInModal;
