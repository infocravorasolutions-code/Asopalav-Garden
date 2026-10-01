import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserPlus, Edit, Trash2, Users, Search, Filter, RefreshCw, Download, Eye, MoreVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import StandaloneAgGrid from '../ui/StandaloneAgGrid';
import EnhancedEmployeeModal from './EnhancedEmployeeModal';
import { api, handleApiError, handleApiSuccess } from '../../utils/fetchInterceptor';
import { SHIFT_ENUM } from '../../constants/shifts';

const TeamPage = () => {
  const { user } = useAuth();
  const { primaryColor } = useCompanyTheme();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showOnlyMyTeam] = useState(true);



  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Choose endpoint based on filter
      const endpoint = showOnlyMyTeam ?
        '/employee/team' :
        '/employee/all';

      const result = await api.get(endpoint);

      if (result.message === 'success') {
        console.log('Team API Response:', result.data);

        // Map API data to grid format
        const teamMembers = result.data.map(employee => ({
          ...employee,
          companyId: employee.companyId || { name: 'Mahakali Farm & Nursery' },
          status: employee.active ? 'Active' : 'Inactive'
        }));

        setEmployees(teamMembers);
        console.log(`Fetched ${showOnlyMyTeam ? 'team members' : 'all employees'}:`, teamMembers.length);
      } else {
        throw new Error(result.message || 'Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setError(error.message);
      handleApiError(error, 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  }, [showOnlyMyTeam]);

  useEffect(() => {
    fetchTeam();
  }, [user?.companyId, showOnlyMyTeam, fetchTeam]);

  // Event handlers for CRUD operations
  const handleEdit = useCallback((employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (employee) => {
    if (window.confirm(`Are you sure you want to remove ${employee.name} from your team?`)) {
      try {
        await api.delete(`/employee/${employee._id}`);

        // Remove from local state
        setEmployees(prev => prev.filter(e => e._id !== employee._id));
        console.log('Team member removed successfully');
        handleApiSuccess('Team member removed successfully');
      } catch (error) {
        console.error('Error removing team member:', error);
        handleApiError(error, 'Failed to remove team member');
      }
    }
  }, []);

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (formData) => {
    try {
      // Backend will automatically set managerId based on who is creating the employee
      const requestData = formData;

      console.log('Saving team member:', { modalMode, requestData });

      let response;
      if (modalMode === 'create') {
        // Create new team member
        response = await api.post('/employee/', requestData);
      } else {
        // Update existing team member
        response = await api.put(`/employee/${selectedEmployee._id}`, requestData);
      }

      console.log('Save response:', response);

      if (modalMode === 'create') {
        // Add new team member to list
        setEmployees(prev => [...prev, response.employee]);
      } else {
        // Update existing team member
        setEmployees(prev => prev.map(e =>
          e._id === selectedEmployee._id ? { ...e, ...response.employee } : e
        ));
      }

      console.log('Team member saved successfully');

      // Refresh the team list
      handleApiSuccess(modalMode === 'create' ? 'Team member created successfully!' : 'Team member updated successfully!');
      setTimeout(() => {
        fetchTeam();
      }, 500);

    } catch (error) {
      console.error('Error saving team member:', error);
      handleApiError(error, 'Failed to save team member');
      throw error;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setModalMode('create');
  };

  const handleRefresh = () => {
    fetchTeam();
  };


  // Column definitions for team members
  const columnDefs = useMemo(() => [
    {
      headerName: 'Photo',
      field: 'photo',
      width: 70,
      cellRenderer: (params) => {
        const photo = params.data.photo;
        const initials = params.data.name ? params.data.name.charAt(0).toUpperCase() : 'E';
        
        return (
          <div className="flex items-center justify-center h-10 w-10 rounded-full overflow-hidden">
            {photo ? (
              <img
                src={photo}
                alt={params.data.name || 'Employee'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-md flex items-center justify-center ${photo ? 'hidden' : 'flex'}`}
            >
              {initials}
            </div>
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
          {params.value || 'Not Set'}
        </div>
      )
    },
    {
      headerName: 'designation',
      field: 'designation',
      width: 150,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-sm text-left">
          {params.value || 'Not Set'}
        </div>
      )
    },
    {
      headerName: 'Shift',
      field: 'shift',
      width: 120,
      cellRenderer: (params) => {
        const shift = params.value || SHIFT_ENUM.MORNING;
        const shiftColors = {
          morning: 'bg-yellow-100 text-yellow-800',
          evening: 'bg-orange-100 text-orange-800',
          night: 'bg-purple-100 text-purple-800'
        };
        return (
          <div className="text-left">
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${shiftColors[shift]}`}>
              {shift.charAt(0).toUpperCase() + shift.slice(1)}
            </span>
          </div>
        );
      }
    },
    {
      headerName: 'Emp Code',
      field: 'empCode',
      width: 120,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-sm font-mono text-left">
          {params.value || 'Not Set'}
        </div>
      )
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      cellRenderer: (params) => {
        const status = params.value || (params.data.active ? 'Active' : 'Inactive');
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
        <div className="flex items-center justify-center">
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
  ], [handleEdit, handleDelete]);

  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
      {/* Header with Title, Description and Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
            <Users className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
              My Team ({employees.length})
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">Manage your team members</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCreateEmployee}
            className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors font-medium touch-manipulation min-h-[44px]"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Assignment Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(emp => emp.managerId && emp.managerId._id === user?._id).length}
            </div>
            <div className="text-sm text-gray-600">Assigned to You</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {employees.filter(emp => emp.managerId && emp.managerId._id !== user?._id).length}
            </div>
            <div className="text-sm text-gray-600">Assigned to Others</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {employees.filter(emp => !emp.managerId).length}
            </div>
            <div className="text-sm text-gray-600">Unassigned</div>
          </div>
        </div>
      </div>

      {/* Standalone AG Grid */}
      <StandaloneAgGrid
        data={employees}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        columnDefs={columnDefs}
        title="Team Members"
        subtitle="Manage your team members"
      />

      {/* Enhanced Employee Modal */}
      <EnhancedEmployeeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
        mode={modalMode}
      />
    </div>
  );
};

export default TeamPage;
