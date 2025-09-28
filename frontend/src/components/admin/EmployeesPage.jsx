import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import StandaloneAgGrid from '../ui/StandaloneAgGrid';
import EmployeeModal from './EmployeeModal';

const EmployeesPage = () => {
  const { user } = useAuth();
  const { primaryColor } = useCompanyTheme();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);



  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5678/api/employee/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.message === 'success') {
        console.log('API Response:', result.data);

        // Map API data to grid format
        const allEmployees = result.data.map(employee => ({
          ...employee,
          companyId: employee.companyId || { name: 'NEELKANTH LANDSCAPE' },
          status: employee.active ? 'Active' : 'Inactive'
        }));

        setEmployees(allEmployees);
        console.log('Fetched employees:', allEmployees.length);
      } else {
        throw new Error(result.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user?.companyId]);

  // Event handlers for CRUD operations
  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async (employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
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
          console.log('Employee deleted successfully');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete employee');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert(`Failed to delete employee: ${error.message}`);
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

      console.log('Saving employee:', { modalMode, formData, url, method });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save response:', result);

        if (modalMode === 'create') {
          // Add new employee to list
          setEmployees(prev => [...prev, result.employee]);
        } else {
          // Update existing employee
          setEmployees(prev => prev.map(e =>
            e._id === selectedEmployee._id ? { ...e, ...result.employee } : e
          ));
        }

        console.log('Employee saved successfully');

        // Refresh the employees list to ensure we have the latest data
        setTimeout(() => {
          fetchEmployees();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('Save error response:', errorData);
        throw new Error(errorData.message || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(`Failed to save employee: ${error.message}`);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setModalMode('create');
  };

  const handleRefresh = () => {
    fetchEmployees();
  };

  const handleExport = () => {
    // Export functionality
    console.log('Export employees');
  };

  // Column definitions for employees
  const columnDefs = useMemo(() => [
    {
      headerName: 'Photo',
      field: 'photo',
      width: 70,
      cellRenderer: (params) => {
        const initials = params.data.name ? params.data.name.charAt(0).toUpperCase() : 'E';
        return (
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 text-white font-semibold text-sm shadow-md">
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
      headerName: 'Created By',
      field: 'createdById.name',
      width: 150,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-sm text-left">
          {params.data.createdById ?
            (typeof params.data.createdById === 'object' ? params.data.createdById.name : params.data.createdById)
            : 'Admin'}
        </div>
      )
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employees ({employees.length})
            </h1>
            <p className="text-gray-600 mt-1">Manage company employees</p>
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
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Standalone AG Grid */}
      <StandaloneAgGrid
        data={employees}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        columnDefs={columnDefs}
        title="Employees"
        subtitle="Manage your company employees"
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

export default EmployeesPage;