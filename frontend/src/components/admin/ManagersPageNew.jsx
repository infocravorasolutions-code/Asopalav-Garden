import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import StandaloneAgGrid from '../ui/StandaloneAgGrid';
import ManagerModal from './ManagerModal';
import { api, handleApiError, handleApiSuccess } from '../../utils/fetchInterceptor';

const ManagersPageNew = () => {
  const { user } = useAuth();
  const { primaryColor } = useCompanyTheme();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedManager, setSelectedManager] = useState(null);


  // Fetch managers data from API
  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/manager/all');

      if (response.message === 'success') {
        console.log('API Response:', response.data);

        // Map API data to grid format
        const allManagers = response.data.map(manager => ({
          ...manager,
          companyId: manager.companyId || { name: 'Mahakali Farm & Nursery' },
          status: manager.isActive ? 'Active' : 'Inactive'
        }));

        setManagers(allManagers);
        console.log('Fetched managers:', allManagers.length);
      } else {
        throw new Error(response.message || 'Failed to fetch managers');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch managers');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [user?.companyId]);

  // Event handlers
  const handleEdit = (manager) => {
    setSelectedManager(manager);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async (manager) => {
    if (window.confirm(`Are you sure you want to delete ${manager.name}?`)) {
      try {
        await api.delete(`/manager/${manager._id}`);

        // Remove from local state
        setManagers(prev => prev.filter(m => m._id !== manager._id));
        console.log('Manager deleted successfully');
        handleApiSuccess('Manager deleted successfully!');
      } catch (error) {
        handleApiError(error, 'Failed to delete manager');
      }
    }
  };

  const handleCreateManager = () => {
    setSelectedManager(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSaveManager = async (formData) => {
    try {
      // Prepare request data
      const requestData = {
        ...formData,
        address: formData.locationAddress || 'Office Address'
      };

      // For create mode, ensure password is provided
      if (modalMode === 'create' && !formData.password) {
        requestData.password = 'manager123'; // Default password if not provided
      }

      // For edit mode, only include password if it's provided
      if (modalMode === 'edit' && !formData.password) {
        delete requestData.password;
        delete requestData.confirmPassword;
      }

      console.log('Saving manager:', { modalMode, requestData });

      let response;
      if (modalMode === 'create') {
        // Create new manager
        response = await api.post('/manager/', requestData);
      } else {
        // Update existing manager
        response = await api.put(`/manager/${selectedManager._id}`, requestData);
      }

      console.log('Save response:', response);

      if (modalMode === 'create') {
        // Add new manager to list
        setManagers(prev => [...prev, response.manager]);
      } else {
        // Update existing manager - ensure we have the correct ID
        setManagers(prev => prev.map(m =>
          m._id === selectedManager._id ? { ...m, ...response.manager } : m
        ));
      }

      console.log('Manager saved successfully');

      // Refresh the managers list to ensure we have the latest data
      handleApiSuccess(modalMode === 'create' ? 'Manager created successfully!' : 'Manager updated successfully!');
      setTimeout(() => {
        fetchManagers();
      }, 500);

    } catch (error) {
      console.error('Error saving manager:', error);
      handleApiError(error, 'Failed to save manager');
      throw error;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedManager(null);
    setModalMode('create');
  };

  const handleRefresh = () => {
    fetchManagers();
  };

  // Column definitions for managers
  const columnDefs = useMemo(() => [
    {
      headerName: 'Photo',
      field: 'photo',
      width: 70,
      cellRenderer: (params) => {
        const initials = params.data.name ? params.data.name.charAt(0).toUpperCase() : 'M';
        return (
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm shadow-md">
            {initials}
          </div>
        );
      },
      pinned: 'left',
      sortable: false,
      filter: false
    },
    {
      headerName: 'Name',
      field: 'name',
      width: 180,
      cellRenderer: (params) => (
        <div className="font-semibold text-gray-900 text-base text-left">
          {params.value}
        </div>
      )
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 250,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-sm truncate text-left" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      headerName: 'Mobile',
      field: 'mobile',
      width: 150,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-sm text-left">
          {params.value}
        </div>
      )
    },
    {
      headerName: 'Company',
      field: 'companyId.name',
      width: 200,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-sm font-medium text-left">
          {params.data.companyId ?
            (typeof params.data.companyId === 'object' ? params.data.companyId.name : params.data.companyId)
            : 'Mahakali Farm & Nursery'}
        </div>
      )
    },
    {
      headerName: 'Location',
      field: 'locationName',
      width: 180,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-sm text-left">
          {params.value || 'Not Set'}
        </div>
      )
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      cellRenderer: (params) => {
        const status = params.value || (params.data.isActive ? 'Active' : 'Inactive');
        return (
          <div className="text-left">
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${status === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {status}
            </span>
          </div>
        );
      }
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      width: 140,
      cellRenderer: (params) => {
        const date = new Date(params.value);
        return (
          <div className="text-gray-600 text-sm text-left">
            {date.toLocaleDateString()}
          </div>
        );
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 100,
      pinned: 'right',
      cellRenderer: (params) => (
        <div className="flex items-center justify-center ">
          <button
            onClick={() => handleEdit(params.data)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(params.data)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      sortable: false,
      filter: false
    }
  ], []);



  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header with Title, Description and Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Managers ({managers.length})
            </h1>
            <p className="text-gray-600 mt-1">Manage company managers</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>↻</div>
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCreateManager}
            className="flex items-center space-x-2 px-5 py-2 text-white rounded-lg transition-colors font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Manager</span>
          </button>
        </div>
      </div>

      {/* Standalone AG Grid */}
      <StandaloneAgGrid
        data={managers}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        columnDefs={columnDefs}
        title="Managers"
        subtitle="Manage your company managers"
      />

      {/* Manager Modal */}
      <ManagerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveManager}
        manager={selectedManager}
        mode={modalMode}
      />
    </div>
  );
};

export default ManagersPageNew;
