import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import StandaloneAgGrid from '../ui/StandaloneAgGrid';
import EmployeeModal from '../admin/EmployeeModal';

const TeamPage = () => {
  const { user } = useAuth();
  const { primaryColor } = useCompanyTheme();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showOnlyMyTeam, setShowOnlyMyTeam] = useState(true);

  // Dummy team data (used as fallback)
  const dummyTeam = [
    {
      _id: 'emp1',
      name: 'Alice Johnson',
      email: 'alice.j@neelkanthlandscape.com',
      mobile: '+91 98765 11111',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      shift: 'morning',
      position: 'Landscape Designer',
      empCode: 'NEEL001',
      status: 'Active',
      createdAt: '2024-01-01T10:00:00Z',
      createdByRole: 'manager',
      createdById: { name: user?.name || 'Manager' }
    },
    {
      _id: 'emp2',
      name: 'Bob Williams',
      email: 'bob.w@neelkanthlandscape.com',
      mobile: '+91 98765 22222',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      shift: 'evening',
      position: 'Garden Supervisor',
      empCode: 'NEEL002',
      status: 'Active',
      createdAt: '2024-01-05T11:30:00Z',
      createdByRole: 'manager',
      createdById: { name: user?.name || 'Manager' }
    }
  ];

  const fetchTeam = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');

      // Choose endpoint based on filter
      const endpoint = showOnlyMyTeam ?
        'http://localhost:5678/api/employee/team' :
        'http://localhost:5678/api/employee/all';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.message === 'success') {
        console.log('Team API Response:', result.data);

        // Map API data to grid format
        const teamMembers = result.data.map(employee => ({
          ...employee,
          companyId: employee.companyId || { name: 'NEELKANTH LANDSCAPE' },
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
      // Use dummy data as fallback
      setEmployees(dummyTeam);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [user?.companyId, showOnlyMyTeam]);

  // Event handlers for CRUD operations
  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async (employee) => {
    if (window.confirm(`Are you sure you want to remove ${employee.name} from your team?`)) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5678/api/employee/${employee._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Remove from local state
          setEmployees(prev => prev.filter(e => e._id !== employee._id));
          console.log('Team member removed successfully');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to remove team member');
        }
      } catch (error) {
        console.error('Error removing team member:', error);
        alert(`Failed to remove team member: ${error.message}`);
      }
    }
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (formData) => {
    try {
      const token = localStorage.getItem('authToken');
      const url = modalMode === 'create'
        ? 'http://localhost:5678/api/employee/'
        : `http://localhost:5678/api/employee/${selectedEmployee._id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      // Backend will automatically set managerId based on who is creating the employee
      const requestData = formData;

      console.log('Saving team member:', { modalMode, requestData, url, method });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save response:', result);

        if (modalMode === 'create') {
          // Add new team member to list
          setEmployees(prev => [...prev, result.employee]);
        } else {
          // Update existing team member
          setEmployees(prev => prev.map(e =>
            e._id === selectedEmployee._id ? { ...e, ...result.employee } : e
          ));
        }

        console.log('Team member saved successfully');

        // Refresh the team list
        setTimeout(() => {
          fetchTeam();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('Save error response:', errorData);
        throw new Error(errorData.message || 'Failed to save team member');
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      alert(`Failed to save team member: ${error.message}`);
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

  const handleExport = () => {
    console.log('Export team members');
  };

  // Column definitions for team members
  const columnDefs = useMemo(() => [
    {
      headerName: 'Photo',
      field: 'photo',
      width: 70,
      cellRenderer: (params) => {
        const initials = params.data.name ? params.data.name.charAt(0).toUpperCase() : 'E';
        return (
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-md">
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
          {params.value || 'Not Set'}
        </div>
      )
    },
    {
      headerName: 'Position',
      field: 'position',
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
        const shift = params.value || 'morning';
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
    <div className="space-y-6 h-full flex flex-col">
      {/* Header with Title, Description and Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
            <Users className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Team ({employees.length})
            </h1>
            <p className="text-gray-600 mt-1">Manage your team members</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          {/* <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyMyTeam}
                onChange={(e) => setShowOnlyMyTeam(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Show only my team
              </span>
            </label>
          </div> */}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>↻</div>
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-4 h-4">⬇</div>
            <span>Export</span>
          </button>
          <button
            onClick={handleCreateEmployee}
            className="flex items-center space-x-2 px-5 py-2 text-white rounded-lg transition-colors font-medium"
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
              {employees.filter(emp => emp.managerId && emp.managerId._id === user?.id).length}
            </div>
            <div className="text-sm text-gray-600">Assigned to You</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {employees.filter(emp => emp.managerId && emp.managerId._id !== user?.id).length}
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

      {/* Employee Modal */}
      <EmployeeModal
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
