import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Map,
  Navigation,
  CheckCircle,
  Circle,
  ArrowUpDown,
  Calendar,
  User
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const SitePointDetailsModal = ({ siteId, point, onClose, onRefresh }) => {
  const [pointDetails, setPointDetails] = useState(point);
  const [loading, setLoading] = useState(false);

  // Fetch detailed point information
  const fetchPointDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sites/${siteId}/points/${point._id}`);
      if (response.data.success) {
        setPointDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching point details:', error);
      toast.error('Failed to fetch point details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointDetails();
  }, [siteId, point._id]);

  const getPointTypeIcon = (type) => {
    switch (type) {
      case 'checkpoint': return '📍';
      case 'work_area': return '🔨';
      case 'storage': return '📦';
      case 'entrance': return '🚪';
      case 'exit': return '🚪';
      case 'break_area': return '☕';
      default: return '📍';
    }
  };

  const getPointTypeColor = (type) => {
    switch (type) {
      case 'checkpoint': return 'bg-blue-100 text-blue-800';
      case 'work_area': return 'bg-green-100 text-green-800';
      case 'storage': return 'bg-purple-100 text-purple-800';
      case 'entrance': return 'bg-yellow-100 text-yellow-800';
      case 'exit': return 'bg-red-100 text-red-800';
      case 'break_area': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getPointTypeIcon(pointDetails.pointType)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{pointDetails.name}</h2>
              <p className="text-sm text-gray-600 font-mono">{pointDetails.pointCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading point details...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Point Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Point Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {pointDetails.coordinates.latitude.toFixed(6)}, {pointDetails.coordinates.longitude.toFixed(6)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPointTypeColor(pointDetails.pointType)}`}>
                      {pointDetails.pointType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Radius: {pointDetails.radius}m
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Map className="w-4 h-4" />
                    <span>
                      Order: {pointDetails.order}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {pointDetails.isRequired ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={pointDetails.isRequired ? 'text-green-600' : 'text-gray-600'}>
                      {pointDetails.isRequired ? 'Required Point' : 'Optional Point'}
                    </span>
                  </div>

                  {pointDetails.description && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {pointDetails.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Point Details</h3>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Point Type</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900 mt-1 capitalize">
                      {pointDetails.pointType.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Radius</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {pointDetails.radius}m
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Order</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {pointDetails.order}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Created By</span>
                </div>
                <p className="text-sm text-gray-600">
                  {pointDetails.createdBy?.name || 'Unknown'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Created At</span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(pointDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SitePointDetailsModal;
