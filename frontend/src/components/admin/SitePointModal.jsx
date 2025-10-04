import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

const SitePointModal = ({ siteId, point, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    radius: 50,
    pointCode: '',
    pointType: 'checkpoint',
    isRequired: false,
    order: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const pointTypes = [
    { value: 'checkpoint', label: 'Checkpoint', icon: '📍' },
    { value: 'work_area', label: 'Work Area', icon: '🔨' },
    { value: 'storage', label: 'Storage', icon: '📦' },
    { value: 'entrance', label: 'Entrance', icon: '🚪' },
    { value: 'exit', label: 'Exit', icon: '🚪' },
    { value: 'break_area', label: 'Break Area', icon: '☕' },
    { value: 'other', label: 'Other', icon: '📍' }
  ];

  // Initialize form data
  useEffect(() => {
    if (point) {
      setFormData({
        name: point.name || '',
        description: point.description || '',
        latitude: point.coordinates?.latitude?.toString() || '',
        longitude: point.coordinates?.longitude?.toString() || '',
        address: point.address || '',
        radius: point.radius || 50,
        pointCode: point.pointCode || '',
        pointType: point.pointType || 'checkpoint',
        isRequired: point.isRequired || false,
        order: point.order || 0
      });
    }
  }, [point]);

  // Handle input change
  const handleChange = (e) => {
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Point name is required';
    }

    if (!formData.pointCode.trim()) {
      newErrors.pointCode = 'Point code is required';
    }

    if (!formData.latitude.trim()) {
      newErrors.latitude = 'Latitude is required';
    } else if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      newErrors.latitude = 'Invalid latitude (must be between -90 and 90)';
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = 'Longitude is required';
    } else if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      newErrors.longitude = 'Invalid longitude (must be between -180 and 180)';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.radius < 5 || formData.radius > 500) {
      newErrors.radius = 'Radius must be between 5 and 500 meters';
    }

    if (formData.order < 0) {
      newErrors.order = 'Order must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
        order: parseInt(formData.order)
      };

      let response;
      if (point) {
        // Update existing point
        response = await api.put(`/sites/${siteId}/points/${point._id}`, payload);
      } else {
        // Create new point
        response = await api.post(`/sites/${siteId}/points`, payload);
      }

      if (response.data.success) {
        toast.success(point ? 'Point updated successfully' : 'Point created successfully');
        onClose(true);
      }
    } catch (error) {
      console.error('Error saving point:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save point';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.loading('Getting your location...', { id: 'location' });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        toast.success('Location obtained successfully', { id: 'location' });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get location', { id: 'location' });
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {point ? 'Edit Point' : 'Add New Point'}
          </h2>
          <button
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Point Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter point name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Point Code *
                </label>
                <Input
                  type="text"
                  name="pointCode"
                  value={formData.pointCode}
                  onChange={handleChange}
                  placeholder="Enter unique point code"
                  className={errors.pointCode ? 'border-red-500' : ''}
                />
                {errors.pointCode && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.pointCode}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter point description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Point Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pointTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.pointType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pointType"
                      value={type.value}
                      checked={formData.pointType === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Get Current Location
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                </label>
                <Input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Enter latitude"
                  step="0.000001"
                  className={errors.latitude ? 'border-red-500' : ''}
                />
                {errors.latitude && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.latitude}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                </label>
                <Input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Enter longitude"
                  step="0.000001"
                  className={errors.longitude ? 'border-red-500' : ''}
                />
                {errors.longitude && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.longitude}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full address of the point"
                rows="3"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radius (meters)
                </label>
                <Input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  placeholder="Enter radius in meters"
                  min="5"
                  max="500"
                  className={errors.radius ? 'border-red-500' : ''}
                />
                {errors.radius && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.radius}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Employees must be within this radius to check in at this point
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <Input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  placeholder="Enter order number"
                  min="0"
                  className={errors.order ? 'border-red-500' : ''}
                />
                {errors.order && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.order}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first in the list
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isRequired"
                checked={formData.isRequired}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Required Point
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Required points must be visited by employees during their work
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {point ? 'Update Point' : 'Create Point'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SitePointModal;
