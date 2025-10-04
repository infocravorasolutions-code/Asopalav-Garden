import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Map,
  Navigation,
  Eye,
  MoreVertical,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  CheckCircle,
  Circle
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import SitePointModal from './SitePointModal';
import SitePointDetailsModal from './SitePointDetailsModal';

const SitePointsManagement = ({ siteId, siteName, onClose }) => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showPointModal, setShowPointModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState(null);

  // Fetch points data
  const fetchPoints = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sites/${siteId}/points`);
      
      if (response.data.success) {
        setPoints(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      toast.error('Failed to fetch points');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/sites/${siteId}/points/statistics`);
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPoints(), fetchStatistics()]);
    setRefreshing(false);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  // Handle create point
  const handleCreatePoint = () => {
    setEditingPoint(null);
    setShowPointModal(true);
  };

  // Handle edit point
  const handleEditPoint = (point) => {
    setEditingPoint(point);
    setShowPointModal(true);
  };

  // Handle view point details
  const handleViewDetails = (point) => {
    setSelectedPoint(point);
    setShowDetailsModal(true);
  };

  // Handle delete point
  const handleDeletePoint = async (pointId) => {
    if (!window.confirm('Are you sure you want to delete this point?')) {
      return;
    }

    try {
      const response = await api.delete(`/sites/${siteId}/points/${pointId}`);
      if (response.data.success) {
        toast.success('Point deleted successfully');
        await handleRefresh();
      }
    } catch (error) {
      console.error('Error deleting point:', error);
      toast.error('Failed to delete point');
    }
  };

  // Handle point modal close
  const handlePointModalClose = (success = false) => {
    setShowPointModal(false);
    setEditingPoint(null);
    if (success) {
      handleRefresh();
    }
  };

  // Handle details modal close
  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedPoint(null);
  };

  // Initial load
  useEffect(() => {
    if (siteId) {
      handleRefresh();
    }
  }, [siteId]);

  const pointTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'checkpoint', label: 'Checkpoint' },
    { value: 'work_area', label: 'Work Area' },
    { value: 'storage', label: 'Storage' },
    { value: 'entrance', label: 'Entrance' },
    { value: 'exit', label: 'Exit' },
    { value: 'break_area', label: 'Break Area' },
    { value: 'other', label: 'Other' }
  ];

  // Filter points based on search and filter
  const filteredPoints = points.filter(point => {
    const matchesSearch = !searchTerm || 
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.pointCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterType || point.pointType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Points Management</h1>
          <p className="text-gray-600">Manage points for {siteName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Back to Sites
          </Button>
          <Button
            onClick={handleCreatePoint}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Point
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Points</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {statistics.totalPoints}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Required</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {statistics.requiredPoints}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">Optional</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {statistics.optionalPoints}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Types</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {Object.keys(statistics.pointTypeStats).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search points by name, code, or description..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pointTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Points Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading points...</span>
        </div>
      ) : filteredPoints.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No points found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType ? 'Try adjusting your search criteria' : 'Get started by adding your first point'}
            </p>
            {!searchTerm && !filterType && (
              <Button onClick={handleCreatePoint}>
                <Plus className="w-4 h-4 mr-2" />
                Add Point
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPoints.map((point) => (
            <Card key={point._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{point.pointTypeIcon}</span>
                    <div>
                      <CardTitle className="text-lg">{point.name}</CardTitle>
                      <p className="text-sm text-gray-600 font-mono">{point.pointCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(point)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPoint(point)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePoint(point._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Map className="w-4 h-4" />
                    <span>
                      {point.coordinates.latitude.toFixed(4)}, {point.coordinates.longitude.toFixed(4)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${point.pointTypeColor}`}>
                      {point.pointType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Radius: {point.radius}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {point.isRequired ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <span>{point.isRequired ? 'Required' : 'Optional'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Order: {point.order}</span>
                    </div>
                  </div>

                  {point.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {point.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showPointModal && (
        <SitePointModal
          siteId={siteId}
          point={editingPoint}
          onClose={handlePointModalClose}
        />
      )}

      {showDetailsModal && selectedPoint && (
        <SitePointDetailsModal
          siteId={siteId}
          point={selectedPoint}
          onClose={handleDetailsModalClose}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default SitePointsManagement;
