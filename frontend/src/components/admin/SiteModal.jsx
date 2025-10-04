import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Navigation
} from 'lucide-react';
import { api, sitePointAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Point Form Component
const PointForm = ({ point, onSave, onCancel, pointTypes }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointCode: '',
    latitude: '',
    longitude: '',
    address: '',
    radius: 50,
    pointType: 'checkpoint',
    isRequired: false,
    order: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (point) {
      setFormData({
        name: point.name || '',
        description: point.description || '',
        pointCode: point.pointCode || '',
        latitude: point.coordinates?.latitude?.toString() || '',
        longitude: point.coordinates?.longitude?.toString() || '',
        address: point.address || '',
        radius: point.radius || 50,
        pointType: point.pointType || 'checkpoint',
        isRequired: point.isRequired || false,
        order: point.order || 0
      });
    }
  }, [point]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const pointData = {
      ...formData,
      coordinates: {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      },
      radius: parseInt(formData.radius)
    };

    onSave(pointData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Point Name *
        </label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter point name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Point Code *
        </label>
        <Input
          name="pointCode"
          value={formData.pointCode}
          onChange={handleChange}
          placeholder="Enter point code"
          className={errors.pointCode ? 'border-red-500' : ''}
        />
        {errors.pointCode && (
          <p className="text-red-500 text-xs mt-1">{errors.pointCode}</p>
        )}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>
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
            <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>
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
          <p className="text-red-500 text-xs mt-1">{errors.address}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Point Type
        </label>
        <select
          name="pointType"
          value={formData.pointType}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {pointTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Radius (meters)
          </label>
          <Input
            type="number"
            name="radius"
            value={formData.radius}
            onChange={handleChange}
            placeholder="Enter radius"
            min="5"
            max="500"
            className={errors.radius ? 'border-red-500' : ''}
          />
          {errors.radius && (
            <p className="text-red-500 text-xs mt-1">{errors.radius}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="isRequired"
            checked={formData.isRequired}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Required Point
          </label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          {point ? 'Update Point' : 'Add Point'}
        </Button>
      </div>
    </form>
  );
};

const SiteModal = ({ site, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 100,
    siteCode: '',
    siteType: 'garden'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Points management
  const [points, setPoints] = useState([]);
  const [showPointModal, setShowPointModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);

  const siteTypes = [
    { value: 'garden', label: 'Garden', icon: '🌱' },
    { value: 'park', label: 'Park', icon: '🌳' },
    { value: 'construction', label: 'Construction', icon: '🏗️' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { value: 'other', label: 'Other', icon: '📍' }
  ];

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
    if (site) {
      setFormData({
        name: site.name || '',
        description: site.description || '',
        address: site.address || '',
        latitude: site.coordinates?.latitude?.toString() || '',
        longitude: site.coordinates?.longitude?.toString() || '',
        radius: site.radius || 100,
        siteCode: site.siteCode || '',
        siteType: site.siteType || 'garden'
      });
      // Initialize points if editing existing site
      setPoints(site.points || []);
    } else {
      // Reset points for new site
      setPoints([]);
    }
  }, [site]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      newErrors.name = 'Site name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.siteCode.trim()) {
      newErrors.siteCode = 'Site code is required';
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

    if (formData.radius < 10 || formData.radius > 1000) {
      newErrors.radius = 'Radius must be between 10 and 1000 meters';
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
        points: points // Include points in the payload
      };

      let response;
      if (site) {
        // Update existing site
        response = await api.put(`/sites/${site._id}`, payload);
      } else {
        // Create new site
        response = await api.post('/sites', payload);
      }

      if (response.data.success) {
        toast.success(site ? 'Site updated successfully' : 'Site created successfully');
        onClose(true);
      }
    } catch (error) {
      console.error('Error saving site:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save site';
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

  // Point management functions
  const handleAddPoint = () => {
    setEditingPoint(null);
    setShowPointModal(true);
  };

  const handleEditPoint = (point) => {
    setEditingPoint(point);
    setShowPointModal(true);
  };

  const handleDeletePoint = (pointId) => {
    if (window.confirm('Are you sure you want to delete this point?')) {
      setPoints(prev => prev.filter(p => p._id !== pointId));
      toast.success('Point deleted successfully');
    }
  };

  const handleSavePoint = async (pointData) => {
    try {
      if (editingPoint) {
        // Update existing point
        await sitePointAPI.updateSitePoint(site._id, editingPoint._id, pointData);
        setPoints(prev => prev.map(p => 
          p._id === editingPoint._id ? { ...p, ...pointData } : p
        ));
        toast.success('Point updated successfully');
      } else {
        // Add new point
        const response = await sitePointAPI.createSitePoint(site._id, pointData);
        const newPoint = {
          _id: response.data.point._id,
          ...pointData,
          order: points.length + 1
        };
        setPoints(prev => [...prev, newPoint]);
        toast.success('Point added successfully');
      }
      setShowPointModal(false);
      setEditingPoint(null);
      // Refresh site data to get updated points
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error saving point:', error);
      toast.error(error.response?.data?.message || 'Failed to save point');
    }
  };

  const handlePointModalClose = () => {
    setShowPointModal(false);
    setEditingPoint(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {site ? 'Edit Site' : 'Create New Site'}
          </h2>
          <button
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter site name"
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
                  Site Code *
                </label>
                <Input
                  type="text"
                  name="siteCode"
                  value={formData.siteCode}
                  onChange={handleChange}
                  placeholder="Enter unique site code"
                  className={errors.siteCode ? 'border-red-500' : ''}
                />
                {errors.siteCode && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.siteCode}
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
                placeholder="Enter site description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter site address"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.address}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {siteTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.siteType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="siteType"
                      value={type.value}
                      checked={formData.siteType === type.value}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Location Information</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <MapPin className="w-4 h-4" />
                Get Current Location
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                Radius (meters)
              </label>
              <Input
                type="number"
                name="radius"
                value={formData.radius}
                onChange={handleChange}
                placeholder="Enter radius in meters"
                min="10"
                max="1000"
                className={errors.radius ? 'border-red-500' : ''}
              />
              {errors.radius && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.radius}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Employees must be within this radius to check in at this site
              </p>
            </div>
          </div>

          {/* Points Management */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Site Points</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPoint}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Point
              </Button>
            </div>

            {points.length > 0 ? (
              <div className="space-y-2">
                {points.map((point, index) => (
                  <div key={point._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg bg-gray-50 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Navigation className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{point.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 break-all">
                          {point.pointCode} • {point.coordinates?.latitude?.toFixed(6)}, {point.coordinates?.longitude?.toFixed(6)}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            point.pointType === 'entrance' ? 'bg-green-100 text-green-800' :
                            point.pointType === 'work_area' ? 'bg-blue-100 text-blue-800' :
                            point.pointType === 'storage' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pointTypes.find(t => t.value === point.pointType)?.label || point.pointType}
                          </span>
                          {point.isRequired && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPoint(point)}
                        className="text-blue-600 hover:text-blue-700 p-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePoint(point._id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No points added yet</p>
                <p className="text-xs text-gray-400">Click "Add Point" to create checkpoints for this site</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 sm:pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {site ? 'Update Site' : 'Create Site'}
            </Button>
          </div>
        </form>
      </div>

      {/* Point Modal */}
      {showPointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingPoint ? 'Edit Point' : 'Add Point'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePointModalClose}
                className="p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <div className="p-3 sm:p-4">
              <PointForm
                point={editingPoint}
                onSave={handleSavePoint}
                onCancel={handlePointModalClose}
                pointTypes={pointTypes}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteModal;
