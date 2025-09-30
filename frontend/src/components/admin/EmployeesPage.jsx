import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import StandaloneAgGrid from '../ui/StandaloneAgGrid';
import EmployeeModal from './EmployeeModal';
import CopyCellRenderer from '../ui/CopyCellRenderer';
import toast from 'react-hot-toast';

const EmployeesPage = () => {
  const { user } = useAuth();
  const { primaryColor } = useCompanyTheme();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);



  const fetchEmployees = async () => {
    setLoading(true);
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
      toast.error(`Failed to fetch employees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user?.companyId]);

  // Event handlers for CRUD operations
  const handleEdit = useCallback((employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (employee) => {
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
          toast.success('Employee deleted successfully!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete employee');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error(`Failed to delete employee: ${error.message}`);
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
      const token = localStorage.getItem('authToken');
      const url = modalMode === 'create'
        ? 'http://localhost:5678/api/employee/'
        : `http://localhost:5678/api/employee/${selectedEmployee._id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      console.log('Saving employee:', { modalMode, formData, url, method });
      console.log('Form data details:', {
        name: formData.name,
        email: formData.email,
        assignedManager: formData.assignedManager,
        managerId: formData.managerId,
        hasAssignedManager: !!formData.assignedManager
      });

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
        toast.success(modalMode === 'create' ? 'Employee created successfully!' : 'Employee updated successfully!');
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
      toast.error(`Failed to save employee: ${error.message}`);
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
      width: 60,
      minWidth: 60,
      maxWidth: 60,
      cellRenderer: (params) => {
        const initials = params.data.name ? params.data.name.charAt(0).toUpperCase() : 'E';
        return (
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 text-white font-semibold text-xs sm:text-sm shadow-md">
            {initials}
          </div>
        );
      },
      pinned: 'left',
      sortable: false,
      filter: false,
      suppressSizeToFit: true
    },
    {
      headerName: 'Name',
      field: 'name',
      width: 150,
      minWidth: 120,
      cellRenderer: (params) => (
        <div className="min-w-0">
          <CopyCellRenderer value={params.value} field="name" />
        </div>
      )
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 200,
      minWidth: 150,
      cellRenderer: (params) => (
        <div className="min-w-0">
          <CopyCellRenderer value={params.value} field="email" />
        </div>
      ),
      hide: window.innerWidth < 768
    },
    {
      headerName: 'Mobile',
      field: 'mobile',
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => (
        <div className="min-w-0">
          <CopyCellRenderer value={params.value || 'Not Set'} field="mobile" />
        </div>
      )
    },
    {
      headerName: 'Position',
      field: 'position',
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => (
        <div className="min-w-0">
          <CopyCellRenderer value={params.value || 'Not Set'} field="position" />
        </div>
      ),
      hide: window.innerWidth < 1024
    },
    {
      headerName: 'Shift',
      field: 'shift',
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => {
        const shift = params.value || 'morning';
        const shiftColors = {
          morning: 'bg-yellow-100 text-yellow-800',
          evening: 'bg-orange-100 text-orange-800',
          night: 'bg-purple-100 text-purple-800'
        };
        return (
          <div className="text-left">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${shiftColors[shift]}`}>
              {shift.charAt(0).toUpperCase() + shift.slice(1)}
            </span>
          </div>
        );
      }
    },
    {
      headerName: 'Emp Code',
      field: 'empCode',
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-xs sm:text-sm font-mono text-left">
          {params.value || 'Not Set'}
        </div>
      )
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => {
        const status = params.value || (params.data.active ? 'Active' : 'Inactive');
        return (
          <div className="text-left">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status === 'Active'
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
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-xs sm:text-sm text-left">
          {params.data.createdById ?
            (typeof params.data.createdById === 'object' ? params.data.createdById.name : params.data.createdById)
            : 'Admin'}
        </div>
      ),
      hide: window.innerWidth < 1024
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => {
        const date = new Date(params.value);
        return (
          <div className="text-gray-600 text-xs sm:text-sm text-left">
            {date.toLocaleDateString()}
          </div>
        );
      },
      hide: window.innerWidth < 768
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      pinned: 'right',
      cellRenderer: (params) => (
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={() => handleEdit(params.data)}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 touch-manipulation min-h-[32px] min-w-[32px]"
            title="Edit"
          >
            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(params.data)}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 touch-manipulation min-h-[32px] min-w-[32px]"
            title="Remove"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      ),
      sortable: false,
      filter: false,
      suppressSizeToFit: true
    }
  ], [handleEdit, handleDelete]);

  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
      {/* Header with Title, Description and Buttons */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
            Employees ({employees.length})
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage company employees</p>
        </div>

        {/* Mobile Layout - Stacked buttons */}
        <div className="flex flex-col space-y-2 sm:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px] flex-1"
            >
              <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>↻</div>
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] flex-1"
            >
              <div className="w-4 h-4">⬇</div>
              <span>Export</span>
            </button>
          </div>
          <button
            onClick={handleCreateEmployee}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors font-medium touch-manipulation min-h-[44px] w-full"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Desktop Layout - Horizontal buttons */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
            >
              <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>↻</div>
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px]"
            >
              <div className="w-4 h-4">⬇</div>
              <span>Export</span>
            </button>
          </div>
          <button
            onClick={handleCreateEmployee}
            className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors font-medium touch-manipulation min-h-[44px]"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Standalone AG Grid */}
      <div className="flex-1 min-h-0">
        <StandaloneAgGrid
          data={employees}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          columnDefs={columnDefs}
          title="Employees"
          subtitle="Manage your company employees"
        />
      </div>

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