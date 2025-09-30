import React, { useState, useCallback, useEffect } from 'react';
import {
    Check,
    X,
    Loader2,
    MapPin,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const StepOutModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
    // State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [location, setLocation] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

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

    // Handle submit
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const stepOutData = {
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
        setLocation('');
        setCurrentLocation(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-1">
            <div className="bg-white rounded-xl w-full max-w-md mx-1 max-h-[98vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Step Out - Clock Out
                        </h3>
                        <p className="text-sm text-gray-600">Confirm your step out</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-manipulation min-h-[44px]"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 lg:p-6">
                    <div className="space-y-4">
                        {/* Current Time Display */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-gray-600" />
                                <span className="font-medium text-gray-900">Current Time</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-700">
                                {new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </p>
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

                        {/* Submit Buttons */}
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
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 touch-manipulation min-h-[44px]"
                            >
                                {isSubmitting || loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Stepping Out...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Step Out
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepOutModal;
