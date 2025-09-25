import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { useManager } from '../../contexts/ManagerContext';
import ManagerForm from './ManagerForm';

const ManagersList = () => {
  const { 
    managers, 
    isLoading, 
    error, 
    fetchManagers, 
    deleteManager 
  } = useManager();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Debounced search to reduce processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  // Optimized filter managers with debounced search
  const filteredManagers = useMemo(() => {
    return managers.filter(manager => {
      const matchesSearch = 
        manager.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        manager.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        manager.mobile?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || manager.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [managers, debouncedSearchTerm, filterStatus]);

  // Paginated data for better performance
  const paginatedManagers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredManagers.slice(startIndex, endIndex);
  }, [filteredManagers, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);

  const handleDeleteManager = async (managerId) => {
    if (window.confirm('Are you sure you want to delete this manager? This action cannot be undone.')) {
      try {
        await deleteManager(managerId);
      } catch (error) {
        // Error is already handled in context
      }
    }
  };

  const handleEditManager = (manager) => {
    setSelectedManager(manager);
    setShowEditModal(true);
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Managers</h1>
          <p className="text-secondary-600">Manage all managers in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchManagers()}
            disabled={isLoading}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Manager
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search managers by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field pl-10 pr-8"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button className="btn-secondary flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Managers</p>
              <p className="text-2xl font-bold text-secondary-900">{managers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {managers.filter(m => m.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Inactive</p>
              <p className="text-2xl font-bold text-red-600">
                {managers.filter(m => m.status === 'inactive').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {managers.filter(m => m.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Shield className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Managers Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-secondary-600">Loading managers...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Error loading managers</p>
            <p className="text-sm text-secondary-500">{error}</p>
            <button 
              onClick={() => fetchManagers()}
              className="btn-primary mt-4"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Address</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedManagers.map((manager) => (
                  <tr key={manager._id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center">
                            <span className="text-secondary-700 text-sm font-medium">
                              {manager.name?.charAt(0)?.toUpperCase() || 'M'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{manager.name}</div>
                          <div className="text-sm text-secondary-500">ID: {manager._id?.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{manager.email}</span>
                    </td>
                    <td>
                      <span className="text-sm">{manager.mobile || "N/A"}</span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-1 max-w-32">
                        <MapPin className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                        <span className="text-sm truncate" title={manager.address}>
                          {manager.address || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-secondary-400" />
                        <span className="text-sm">{formatDate(manager.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${
                        manager.status === 'active' ? 'badge-success' : 
                        manager.status === 'inactive' ? 'badge-error' : 
                        'badge-accent'
                      }`}>
                        {manager.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditManager(manager)}
                          className="btn btn-ghost btn-xs"
                          title="Edit Manager"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteManager(manager._id)}
                          className="btn btn-ghost btn-xs"
                          title="Delete Manager"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enhanced Pagination Controls for Managers */}
        {filteredManagers.length > 0 && (
          <div className="card p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              {/* Pagination Info and Controls */}
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    Showing
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {((currentPage - 1) * itemsPerPage) + 1}
                  </span>
                  <span className="text-sm text-gray-500">to</span>
                  <span className="text-sm font-bold text-purple-600">
                    {Math.min(currentPage * itemsPerPage, filteredManagers.length)}
                  </span>
                  <span className="text-sm text-gray-500">of</span>
                  <span className="text-sm font-bold text-purple-600">
                    {filteredManagers.length}
                  </span>
                  <span className="text-sm text-gray-500">managers</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="select select-bordered select-sm bg-white border-purple-300 focus:border-purple-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={15}>15 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>
              
              {/* Pagination Navigation */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  {/* First Page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="btn btn-outline btn-sm hover:btn-secondary"
                        title="First page"
                      >
                        ««
                      </button>
                      {currentPage > 4 && <span className="text-gray-400">...</span>}
                    </>
                  )}
                  
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm hover:btn-secondary disabled:opacity-50"
                    title="Previous page"
                  >
                    «
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`btn btn-sm ${
                            currentPage === pageNum 
                              ? 'btn-secondary text-white' 
                              : 'btn-outline hover:btn-secondary'
                          }`}
                          title={`Page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm hover:btn-secondary disabled:opacity-50"
                    title="Next page"
                  >
                    »
                  </button>
                  
                  {/* Last Page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="btn btn-outline btn-sm hover:btn-secondary"
                        title="Last page"
                      >
                        »»
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Quick Jump to Page */}
            {totalPages > 10 && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-gray-600">Jump to page:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                      setCurrentPage(page);
                    }}
                    className="input input-bordered input-sm w-20 text-center"
                  />
                  <span className="text-sm text-gray-500">of {totalPages}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Manager Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Manager</h3>
            <p className="text-secondary-600 mb-4">Create a new manager account</p>
            
            <ManagerForm
              onClose={() => setShowAddModal(false)}
              onSuccess={() => {
                setShowAddModal(false);
                fetchManagers();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Manager Modal */}
      {showEditModal && selectedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Manager</h3>
            <p className="text-secondary-600 mb-4">Update manager information</p>
            
            <ManagerForm
              manager={selectedManager}
              onClose={() => {
                setShowEditModal(false);
                setSelectedManager(null);
              }}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedManager(null);
                fetchManagers();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagersList;
