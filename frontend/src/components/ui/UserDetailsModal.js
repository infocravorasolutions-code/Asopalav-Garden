import React, { useState } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Clock, 
  Battery, 
  Wifi, 
  WifiOff, 
  Phone, 
  Mail, 
  Navigation,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import LocationDisplay from './LocationDisplay';
import toast from 'react-hot-toast';

const UserDetailsModal = ({ isOpen, onClose, user, location }) => {
  const [copied, setCopied] = useState(false);

  const copyCoordinates = async () => {
    if (location) {
      const coordText = `${location.latitude}, ${location.longitude}`;
      try {
        await navigator.clipboard.writeText(coordText);
        setCopied(true);
        toast.success('Coordinates copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy coordinates');
      }
    }
  };

  const openInMaps = () => {
    if (location) {
      const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel >= 80) return <Battery className="h-4 w-4 text-green-600" />;
    if (batteryLevel >= 50) return <Battery className="h-4 w-4 text-yellow-600" />;
    if (batteryLevel >= 20) return <Battery className="h-4 w-4 text-orange-600" />;
    return <Battery className="h-4 w-4 text-red-600" />;
  };

  const getBatteryColor = (batteryLevel) => {
    if (batteryLevel >= 80) return 'text-green-600';
    if (batteryLevel >= 50) return 'text-yellow-600';
    if (batteryLevel >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'tracking': return 'bg-blue-100 text-blue-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.empCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
              {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
            </span>
          </div>

          {/* Employee Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Employee Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Designation:</span>
                <span className="font-medium">{user.designation || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Shift:</span>
                <span className="font-medium">{user.shift || 'N/A'}</span>
              </div>
              {user.mobile && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">{user.mobile}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          {location && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Current Location</h4>
              
              {/* Coordinates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Coordinates</span>
                  <button
                    onClick={copyCoordinates}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-sm text-gray-600 font-mono">
                  <div>Lat: {location.latitude?.toFixed(6)}</div>
                  <div>Lng: {location.longitude?.toFixed(6)}</div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="text-sm font-medium text-gray-700 block mb-2">Address</span>
                <LocationDisplay
                  latitude={location.latitude}
                  longitude={location.longitude}
                  address={location.address}
                  size="small"
                />
              </div>

              {/* Last Update */}
              {location.lastUpdate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Last updated: {new Date(location.lastUpdate).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Device Information */}
          {/* <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Device Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                {user.batteryLevel ? getBatteryIcon(user.batteryLevel) : <Battery className="h-4 w-4 text-gray-400" />}
                <span className="text-gray-600">Battery:</span>
                <span className={`font-medium ${user.batteryLevel ? getBatteryColor(user.batteryLevel) : 'text-gray-600'}`}>
                  {user.batteryLevel ? `${user.batteryLevel}%` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {user.isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                <span className="text-gray-600">Connection:</span>
                <span className={`font-medium ${user.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {user.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div> */}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={openInMaps}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View in Maps</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
