import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';

const ManagersPage = () => {
  const { user } = useAuth();
  const { primaryColor } = useCompanyTheme();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);

  // Dummy managers data
  const dummyManagers = [
    {
      _id: '1',
      name: 'John Smith',
      email: 'john.smith@neelkanthlandscape.com',
      mobile: '+91 98765 43210',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Mumbai Office',
      status: 'Active',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      _id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@neelkanthlandscape.com',
      mobile: '+91 98765 43211',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Delhi Office',
      status: 'Active',
      createdAt: '2024-01-20T14:45:00Z'
    },
    {
      _id: '3',
      name: 'Michael Brown',
      email: 'michael.brown@neelkanthlandscape.com',
      mobile: '+91 98765 43212',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Bangalore Office',
      status: 'Active',
      createdAt: '2024-02-01T09:15:00Z'
    },
    {
      _id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@neelkanthlandscape.com',
      mobile: '+91 98765 43213',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Chennai Office',
      status: 'Inactive',
      createdAt: '2024-02-10T16:20:00Z'
    },
    {
      _id: '5',
      name: 'David Wilson',
      email: 'david.wilson@neelkanthlandscape.com',
      mobile: '+91 98765 43214',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Kolkata Office',
      status: 'Active',
      createdAt: '2024-02-15T11:30:00Z'
    },
    {
      _id: '6',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@neelkanthlandscape.com',
      mobile: '+91 98765 43215',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Pune Office',
      status: 'Active',
      createdAt: '2024-02-20T13:45:00Z'
    },
    {
      _id: '7',
      name: 'Robert Taylor',
      email: 'robert.taylor@neelkanthlandscape.com',
      mobile: '+91 98765 43216',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Hyderabad Office',
      status: 'Active',
      createdAt: '2024-03-01T08:00:00Z'
    },
    {
      _id: '8',
      name: 'Jennifer Martinez',
      email: 'jennifer.martinez@neelkanthlandscape.com',
      mobile: '+91 98765 43217',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Ahmedabad Office',
      status: 'Active',
      createdAt: '2024-03-05T12:15:00Z'
    },
    {
      _id: '9',
      name: 'William Garcia',
      email: 'william.garcia@neelkanthlandscape.com',
      mobile: '+91 98765 43218',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Jaipur Office',
      status: 'Inactive',
      createdAt: '2024-03-10T15:30:00Z'
    },
    {
      _id: '10',
      name: 'Amanda Rodriguez',
      email: 'amanda.rodriguez@neelkanthlandscape.com',
      mobile: '+91 98765 43219',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Lucknow Office',
      status: 'Active',
      createdAt: '2024-03-15T10:45:00Z'
    },
    {
      _id: '11',
      name: 'Christopher Lee',
      email: 'christopher.lee@neelkanthlandscape.com',
      mobile: '+91 98765 43220',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Chandigarh Office',
      status: 'Active',
      createdAt: '2024-03-20T14:20:00Z'
    },
    {
      _id: '12',
      name: 'Michelle White',
      email: 'michelle.white@neelkanthlandscape.com',
      mobile: '+91 98765 43221',
      companyId: { name: 'NEELKANTH LANDSCAPE' },
      locationName: 'Indore Office',
      status: 'Active',
      createdAt: '2024-03-25T09:30:00Z'
    }
  ];

  // Fetch managers data from API
  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5678/api/manager/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.message === 'success') {
        console.log('API Response:', result.data);
        console.log('User companyId:', user?.companyId);
        
        // For now, show all managers since companyId is null in the data
        // TODO: Update backend to properly associate managers with companies
        const allManagers = result.data.map(manager => ({
          ...manager,
          companyId: manager.companyId || { name: 'NEELKANTH LANDSCAPE' },
          status: manager.isActive ? 'Active' : 'Inactive'
        }));
        
        setManagers(allManagers);
        setFilteredData(allManagers);
        console.log('Fetched managers:', allManagers.length);
      } else {
        throw new Error(result.message || 'Failed to fetch managers');
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
      setError(error.message);
      // Fallback to dummy data if API fails
      setManagers(dummyManagers);
      setFilteredData(dummyManagers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [user?.companyId]);

  // Search functionality
  useEffect(() => {
    if (searchText) {
      const filtered = managers.filter(manager => 
        manager.name.toLowerCase().includes(searchText.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchText.toLowerCase()) ||
        manager.mobile.includes(searchText) ||
        (manager.companyId && 
          (typeof manager.companyId === 'object' ? manager.companyId.name : manager.companyId)
          .toLowerCase().includes(searchText.toLowerCase())) ||
        (manager.locationName && manager.locationName.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(managers);
    }
  }, [searchText, managers]);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Photo',
      field: 'photo',
      width: 60,
      minWidth: 60,
      maxWidth: 60,
      cellRenderer: (params) => {
        const initials = params.data.name ? params.data.name.charAt(0).toUpperCase() : 'M';
        return (
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md">
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
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => (
        <div className="font-medium text-gray-900 text-sm truncate">{params.value}</div>
      )
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 180,
      minWidth: 150,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-xs sm:text-sm truncate" title={params.value}>
          {params.value}
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
        <div className="text-gray-600 text-xs sm:text-sm">{params.value}</div>
      )
    },
    {
      headerName: 'Company',
      field: 'companyId.name',
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-xs sm:text-sm font-medium truncate">
          {params.data.companyId ? 
            (typeof params.data.companyId === 'object' ? params.data.companyId.name : params.data.companyId) 
            : 'NEELKANTH LANDSCAPE'}
        </div>
      ),
      hide: window.innerWidth < 1024
    },
    {
      headerName: 'Location',
      field: 'locationName',
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => (
        <div className="text-gray-600 text-xs sm:text-sm truncate">
          {params.value || 'Not Set'}
        </div>
      )
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 80,
      minWidth: 70,
      cellRenderer: (params) => {
        const status = params.value || (params.data.isActive ? 'Active' : 'Inactive');
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            status === 'Active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => {
        const date = new Date(params.value);
        return (
          <div className="text-gray-600 text-xs sm:text-sm">
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
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleEdit(params.data)}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation min-h-[32px] min-w-[32px]"
            title="Edit Manager"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={() => handleDelete(params.data)}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation min-h-[32px] min-w-[32px]"
            title="Remove Manager"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      ),
      sortable: false,
      filter: false,
      suppressSizeToFit: true
    }
  ], []);

  // Grid options
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 8px',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    headerHeight: 50,
    rowHeight: 60
  };

  // Grid options moved inline to AgGridReact component

  // Event handlers
  const onGridReady = (params) => {
    setGridApi(params.api);
    console.log('Grid ready with data:', filteredData);
    console.log('Grid API:', params.api);
  };

  const handleView = (manager) => {
    console.log('View manager:', manager);
    // Implement view functionality
  };

  const handleEdit = (manager) => {
    console.log('Edit manager:', manager);
    // Implement edit functionality
  };

  const handleDelete = (manager) => {
    console.log('Delete manager:', manager);
    // Implement delete functionality
  };

  const handleCreateManager = () => {
    console.log('Create new manager');
    // Implement create functionality
  };

  const handleRefresh = () => {
    fetchManagers();
  };

  const handleExport = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv();
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="w-full mb-4 sm:mb-6">
        {/* Title Section */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Managers</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage company managers</p>
        </div>
        
        {/* Mobile Layout - Full width buttons */}
        <div className="w-full sm:hidden space-y-3 px-1">
          {/* Primary Action - Full width */}
          <button
            onClick={handleCreateManager}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg transition-colors touch-manipulation min-h-[48px] font-medium mx-0"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="h-5 w-5" />
            <span>Add Manager</span>
          </button>
          
          {/* Secondary Actions - Side by side */}
          <div className="flex items-center space-x-2 w-full">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-2 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center space-x-2 px-2 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px]"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Desktop Layout - Horizontal buttons */}
        <div className="hidden sm:flex items-center justify-between">
          <div></div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px]"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleCreateManager}
              className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors touch-manipulation min-h-[44px]"
              style={{ backgroundColor: primaryColor }}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Manager</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">
              <strong>API Error:</strong> {error}. Showing dummy data as fallback.
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search managers..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[44px]"
          />
        </div>
        <button className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] w-full sm:w-auto">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Stats Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-blue-700">
              <span className="font-medium">{filteredData.length}</span> managers found
            </div>
            {loading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
          {error && (
            <div className="text-sm text-red-600">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
        </div>
      </div>

      {/* AG Grid */}
      <div className="flex-1 min-h-0">
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: window.innerWidth < 768 ? '400px' : '500px', 
            width: '100%',
            minHeight: window.innerWidth < 768 ? '300px' : '400px',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <AgGridReact
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={window.innerWidth < 768 ? 5 : 10}
            paginationPageSizeSelector={window.innerWidth < 768 ? [5, 10] : [5, 10, 20, 50]}
            suppressRowClickSelection={true}
            rowSelection="multiple"
            animateRows={true}
            enableRangeSelection={true}
            onGridReady={onGridReady}
            loading={loading}
            overlayLoadingTemplate="<span>Loading managers...</span>"
            overlayNoRowsTemplate="<span>No managers found</span>"
            suppressColumnVirtualisation={false}
            suppressRowVirtualisation={false}
            suppressHorizontalScroll={window.innerWidth < 768}
            suppressColumnMoveAnimation={true}
            suppressRowHoverHighlight={window.innerWidth < 768}
            domLayout="normal"
            ensureDomOrder={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagersPage;
