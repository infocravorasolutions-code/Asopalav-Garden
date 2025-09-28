import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Camera,
    Check,
    X,
    RotateCcw,
    Upload,
    Loader2,
    MapPin,
    Clock
} from 'lucide-react';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';

const StepOutModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
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

    // Get current location
    const getCurrentLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by this browser');
            return;
        }

        setLocationLoading(true);
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            });

            const { latitude, longitude } = position.coords;
            setCurrentLocation({ latitude, longitude });
            setLocation(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

            // Try to get address from coordinates (optional)
            try {
                const response = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();
                if (data.locality) {
                    const addressParts = [];
                    if (data.locality && typeof data.locality === 'string') addressParts.push(data.locality);
                    if (data.principalSubdivision && typeof data.principalSubdivision === 'string') addressParts.push(data.principalSubdivision);
                    if (data.countryName && typeof data.countryName === 'string') addressParts.push(data.countryName);
                    if (data.postcode && typeof data.postcode === 'string') addressParts.push(data.postcode);
                    if (data.city && typeof data.city === 'string') addressParts.push(data.city);
                    if (data.administrativeArea && typeof data.administrativeArea === 'string') addressParts.push(data.administrativeArea);

                    const address = addressParts.join(', ');
                    setLocation(address);
                }
            } catch {
                console.log('Could not get address from coordinates, using coordinates as location');
            }

            toast.success('Location captured successfully!');
        } catch (error) {
            console.error('Error getting location:', error);
            toast.error('Could not get current location. Please enter manually.');
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
            const file = new File([blob], `stepout_${Date.now()}.jpg`, {
                type: 'image/jpeg',
            });

            const stepOutData = {
                stepOutImage: file,
                stepOutLocation: location || 'Current Location',
                status: 'absent', // Always checked_out for step-out
                coordinates: currentLocation
            };

            await onSubmit(stepOutData);
            handleClose();
        } catch (error) {
            console.error('Error submitting step-out:', error);
            toast.error('Failed to submit step-out');
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Step Out - Clock Out
                        </h3>
                        <p className="text-sm text-gray-600">Capture photo and enter details</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Camera/Image Content */}
                <div className="p-6">
                    <div className="relative mb-6">
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
                                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white"
                                    >
                                        <RotateCcw className="h-5 w-5 text-gray-700" />
                                    </button>

                                    <button
                                        onClick={capture}
                                        disabled={!cameraReady}
                                        className="p-4 bg-red-600 rounded-full shadow-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        <Camera className="h-6 w-6 text-white" />
                                    </button>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white"
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
                                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white"
                                    >
                                        <RotateCcw className="h-5 w-5 text-gray-700" />
                                    </button>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || loading}
                                        className="p-4 bg-red-600 rounded-full shadow-lg hover:bg-red-700 disabled:opacity-50"
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
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={getCurrentLocation}
                                        disabled={locationLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
                                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || loading}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting || loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Submit Step Out
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

export default StepOutModal;
