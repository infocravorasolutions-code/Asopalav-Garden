import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  Map,
  Building,
  Eye,
  MoreVertical,
  RefreshCw,
  Loader2
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import SiteModal from './SiteModal';
import SiteDetailsModal from './SiteDetailsModal';

const SiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSites: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch sites data
  const fetchSites = async (page = 1, search = '', type = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(type && { siteType: type })
      });

      const response = await api.get(`/sites?${params}`);
      
      if (response.data.success) {
        setSites(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to fetch sites');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSites(pagination.currentPage, searchTerm, filterType);
    setRefreshing(false);
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchSites(1, value, filterType);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterType(value);
    fetchSites(1, searchTerm, value);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchSites(page, searchTerm, filterType);
  };

  // Handle create site
  const handleCreateSite = () => {
    setEditingSite(null);
    setShowSiteModal(true);
  };

  // Handle edit site
  const handleEditSite = (site) => {
    setEditingSite(site);
    setShowSiteModal(true);
  };

  // Handle view site details
  const handleViewDetails = (site) => {
    setSelectedSite(site);
    setShowDetailsModal(true);
  };

  // Handle delete site
  const handleDeleteSite = async (siteId) => {
    if (!window.confirm('Are you sure you want to delete this site?')) {
      return;
    }

    try {
      const response = await api.delete(`/sites/${siteId}`);
      if (response.data.success) {
        toast.success('Site deleted successfully');
        await fetchSites(pagination.currentPage, searchTerm, filterType);
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error('Failed to delete site');
    }
  };

  // Handle site modal close
  const handleSiteModalClose = (success = false) => {
    setShowSiteModal(false);
    setEditingSite(null);
    if (success) {
      fetchSites(pagination.currentPage, searchTerm, filterType);
    }
  };

  // Handle details modal close
  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedSite(null);
  };


  // Initial load
  useEffect(() => {
    fetchSites();
  }, []);

  const siteTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'garden', label: 'Garden' },
    { value: 'park', label: 'Park' },
    { value: 'construction', label: 'Construction' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ];

  const getSiteTypeIcon = (type) => {
    switch (type) {
      case 'garden':
        return '🌱';
      case 'park':
        return '🌳';
      case 'construction':
        return '🏗️';
      case 'maintenance':
        return '🔧';
      default:
        return '📍';
    }
  };

  const getSiteTypeColor = (type) => {
    switch (type) {
      case 'garden':
        return 'bg-green-100 text-green-800';
      case 'park':
        return 'bg-blue-100 text-blue-800';
      case 'construction':
        return 'bg-orange-100 text-orange-800';
      case 'maintenance':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Management</h1>
          <p className="text-gray-600">Manage and assign sites to employees</p>
        </div>
        <Button
          onClick={handleCreateSite}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Site
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search sites by name, code, or address..."
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
                {siteTypeOptions.map(option => (
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

      {/* Sites Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading sites...</span>
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sites found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType ? 'Try adjusting your search criteria' : 'Get started by creating your first site'}
            </p>
            {!searchTerm && !filterType && (
              <Button onClick={handleCreateSite}>
                <Plus className="w-4 h-4 mr-2" />
                Create Site
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Card key={site._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getSiteTypeIcon(site.siteType)}</span>
                    <div>
                      <CardTitle className="text-lg">{site.name}</CardTitle>
                      <p className="text-sm text-gray-600 font-mono">{site.siteCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(site)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSite(site)}
                      title="Edit Site (includes Points Management)"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSite(site._id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete Site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{site.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSiteTypeColor(site.siteType)}`}>
                      {site.siteType.charAt(0).toUpperCase() + site.siteType.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Radius: {site.radius}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{site.assignedEmployeesCount} assigned</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{site.points?.length || 0} points</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Map className="w-3 h-3" />
                      <span>
                        {site.coordinates.latitude.toFixed(4)}, {site.coordinates.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {site.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {site.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {sites.length} of {pagination.totalSites} sites
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showSiteModal && (
        <SiteModal
          site={editingSite}
          onClose={handleSiteModalClose}
        />
      )}

      {showDetailsModal && selectedSite && (
        <SiteDetailsModal
          site={selectedSite}
          onClose={handleDetailsModalClose}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default SiteManagement;
