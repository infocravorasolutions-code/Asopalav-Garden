import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Search, Edit, Trash2 } from 'lucide-react';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const StandaloneAgGrid = ({ 
  data = [], 
  loading = false, 
  onEdit, 
  onDelete,
  columnDefs = [],
  title = "Data Grid",
  subtitle = "Manage your data"
}) => {
  const [filteredData, setFilteredData] = useState(data);
  const [searchText, setSearchText] = useState('');
  const [gridApi, setGridApi] = useState(null);

  // Update filtered data when data or search changes
  useEffect(() => {
    if (searchText.trim()) {
      const filtered = data.filter(item => 
        (item.name && item.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.locationName && item.locationName.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data, searchText]);

  // Use column definitions from props
  const finalColumnDefs = useMemo(() => {
    if (columnDefs.length > 0) {
      return columnDefs;
    }
    // Default column definitions if none provided
    return [
      {
        headerName: 'Photo',
        field: 'photo',
        width: 70,
        cellRenderer: (params) => {
          const initials = params.data.name ? params.data.name.charAt(0).toUpperCase() : 'U';
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
          <div className="font-semibold text-gray-900 text-base">{params.value}</div>
        )
      },
      {
        headerName: 'Email',
        field: 'email',
        width: 250,
        cellRenderer: (params) => (
          <div className="text-gray-600 text-sm truncate" title={params.value}>
            {params.value}
          </div>
        )
      },
      {
        headerName: 'Actions',
        field: 'actions',
        width: 100,
        pinned: 'right',
        cellRenderer: (params) => (
          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={() => onEdit && onEdit(params.data)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete && onDelete(params.data)}
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
    ];
  }, [columnDefs, onEdit, onDelete]);

  // Grid options
  const defaultColDef = {
    sortable: true,
    filter: false,
    resizable: true,
    flex: 1,
    minWidth: 100,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      height: '100%',
      paddingLeft: '8px'
    }
  };

  // Event handlers
  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };


  return (
    <div className="space-y-4 h-full flex flex-col">

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={searchText}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
      </div>


      {/* AG Grid */}
      <div 
        className="ag-theme-alpine" 
        style={{ 
          height: '430px', 
          width: '100%',
          minHeight: '400px'
        }}
      >
        <AgGridReact
          rowData={filteredData}
          columnDefs={finalColumnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={8}
          paginationPageSizeSelector={[5, 8, 10, 20]}
          suppressRowClickSelection={true}
          rowSelection="multiple"
          animateRows={true}
          rowStyle={{ 
            fontSize: '14px',
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}
          enableRangeSelection={true}
          onGridReady={onGridReady}
          loading={loading}
          overlayLoadingTemplate="<span>Loading data...</span>"
          overlayNoRowsTemplate="<span>No records found</span>"
          headerHeight={45}
          rowHeight={55}
          suppressColumnVirtualisation={false}
          suppressRowVirtualisation={false}
        />
      </div>
    </div>
  );
};

export default StandaloneAgGrid;
