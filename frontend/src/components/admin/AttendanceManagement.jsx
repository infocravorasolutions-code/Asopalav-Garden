import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
    Search,
    Filter,
    RefreshCw,
    FileText,
    Download,
    Clock,
    Users,
    UserCheck,
    UserX,
    MapPin,
    Calendar,
    TrendingUp,
    X,
    Save
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import { adminAPI, api } from '../../services/api';
import toast from 'react-hot-toast';

const AttendanceManagement = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        dateRange: '',
        shift: '',
        status: ''
    });
    const [summary, setSummary] = useState({
        totalRecords: 0,
        present: 0,
        absent: 0,
        totalHours: 0,
        morningShift: 0,
        eveningShift: 0,
        nightShift: 0
    });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [editForm, setEditForm] = useState({
        stepIn: '',
        stepOut: '',
        shift: 'morning',
        status: 'present',
        address: '',
        note: ''
    });

    // AG Grid column definitions
    const columnDefs = useMemo(() => [
        {
            headerName: 'Employee',
            field: 'employee',
            cellRenderer: (params) => {
                const employee = params.data.employeeId;
                return (
                    <div className="flex items-center space-x-3 py-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                                {employee?.name?.charAt(0) || 'N/A'}
                            </span>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{employee?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{employee?.empCode || 'N/A'}</div>
                        </div>
                    </div>
                );
            },
            width: 200,
            pinned: 'left'
        },
        {
            headerName: 'Date',
            field: 'date',
            cellRenderer: (params) => {
                const date = new Date(params.data.stepIn);
                return (
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{date.toLocaleDateString()}</span>
                    </div>
                );
            },
            width: 120
        },
        {
            headerName: 'Shift',
            field: 'shift',
            cellRenderer: (params) => {
                const shift = params.data.shift;
                const getShiftColor = (shift) => {
                    switch (shift) {
                        case 'morning': return 'bg-blue-100 text-blue-800';
                        case 'evening': return 'bg-orange-100 text-orange-800';
                        case 'night': return 'bg-purple-100 text-purple-800';
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShiftColor(shift)}`}>
                        {shift || 'N/A'}
                    </span>
                );
            },
            width: 100
        },
        {
            headerName: 'CLOCK IN',
            field: 'stepIn',
            cellRenderer: (params) => {
                const stepIn = params.data.stepIn;
                return stepIn ? new Date(stepIn).toLocaleTimeString() : 'N/A';
            },
            width: 120
        },
        {
            headerName: 'CLOCK OUT',
            field: 'stepOut',
            cellRenderer: (params) => {
                const stepOut = params.data.stepOut;
                return stepOut ? new Date(stepOut).toLocaleTimeString() : 'N/A';
            },
            width: 120
        },
        {
            headerName: 'STATUS',
            field: 'status',
            cellRenderer: (params) => {
                const status = params.data.status;
                const getStatusColor = (status) => {
                    switch (status) {
                        case 'present': return 'bg-green-100 text-green-800';
                        case 'absent': return 'bg-red-100 text-red-800';
                        case 'late': return 'bg-orange-100 text-orange-800';
                        case 'half-day': return 'bg-blue-100 text-blue-800';
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
                    </span>
                );
            },
            width: 120
        },
        {
            headerName: 'LOCATION',
            field: 'address',
            cellRenderer: (params) => {
                const address = params.data.address;
                return address || 'N/A';
            },
            width: 300
        },
        {
            headerName: 'ACTIONS',
            field: 'actions',
            cellRenderer: (params) => {
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleEditAttendance(params.data)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleDeleteAttendance(params.data)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                );
            },
            width: 100,
            pinned: 'right'
        }
    ], []);

    // AG Grid options
    const gridOptions = {
        defaultColDef: {
            sortable: true,
            filter: true,
            resizable: true,
        },
        pagination: true,
        paginationPageSize: 20,
        rowHeight: 60,
        suppressRowHoverHighlight: false,
        animateRows: true,
    };

    // Fetch attendance data
    const fetchAttendanceData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await adminAPI.getAttendance(params);
            const data = response.attendance || [];
            setAttendanceData(data);

            // Calculate summary
            const summary = calculateSummary(data);
            setSummary(summary);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate summary statistics
    const calculateSummary = (data) => {
        const totalRecords = data.length;
        const present = data.filter(record => record.status === 'present').length;
        const absent = data.filter(record => record.status === 'absent').length;
        const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0) / 60;

        const morningShift = data.filter(record => record.shift === 'morning').length;
        const eveningShift = data.filter(record => record.shift === 'evening').length;
        const nightShift = data.filter(record => record.shift === 'night').length;

        return {
            totalRecords,
            present,
            absent,
            totalHours: totalHours.toFixed(1),
            morningShift,
            eveningShift,
            nightShift
        };
    };

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return attendanceData;

        return attendanceData.filter(record => {
            const employee = record.employeeId;
            const searchLower = searchTerm.toLowerCase();
            return (
                employee?.name?.toLowerCase().includes(searchLower) ||
                employee?.email?.toLowerCase().includes(searchLower) ||
                record.address?.toLowerCase().includes(searchLower)
            );
        });
    }, [attendanceData, searchTerm]);

    // Export to Excel
    const exportToExcel = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/api/attendence/export/excel?${params.toString()}`, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('Attendance data exported to Excel successfully!');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export attendance data to Excel');
        }
    };

    // Export to PDF
    const exportToPDF = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/api/attendence/export/pdf?${params.toString()}`, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('Attendance data exported to PDF successfully!');
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Failed to export attendance data to PDF');
        }
    };

    // Handle edit attendance
    const handleEditAttendance = (attendance) => {
        setSelectedAttendance(attendance);
        setEditForm({
            stepIn: attendance.stepIn ? new Date(attendance.stepIn).toISOString().slice(0, 16) : '',
            stepOut: attendance.stepOut ? new Date(attendance.stepOut).toISOString().slice(0, 16) : '',
            shift: attendance.shift || 'morning',
            status: attendance.status || 'present',
            address: attendance.address || '',
            note: attendance.note || ''
        });
        setEditModalOpen(true);
    };

    // Handle delete attendance
    const handleDeleteAttendance = async (attendance) => {
        if (window.confirm('Are you sure you want to delete this attendance record?')) {
            try {
                await adminAPI.deleteAttendance(attendance._id);
                await fetchAttendanceData();
                alert('Attendance record deleted successfully');
            } catch (error) {
                console.error('Error deleting attendance:', error);
                alert('Error deleting attendance record');
            }
        }
    };

    // Handle save attendance changes
    const handleSaveAttendance = async () => {
        try {
            const updateData = {
                stepIn: editForm.stepIn ? new Date(editForm.stepIn) : null,
                stepOut: editForm.stepOut ? new Date(editForm.stepOut) : null,
                shift: editForm.shift,
                status: editForm.status,
                address: editForm.address,
                note: editForm.note
            };

            await adminAPI.updateAttendance(selectedAttendance._id, updateData);
            await fetchAttendanceData();
            setEditModalOpen(false);
            alert('Attendance record updated successfully');
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Error updating attendance record');
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchAttendanceData();
    }, []);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                        Monitor and manage employee attendance records
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <Button
                        onClick={() => fetchAttendanceData()}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </Button>
                    <Button
                        onClick={exportToExcel}
                        className="flex items-center space-x-2"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Export Excel</span>
                    </Button>
                    <Button
                        onClick={exportToPDF}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export PDF</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Records</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.totalRecords}</p>
                                <p className="text-sm text-gray-500">100% attendance rate</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Present</p>
                                <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                                <p className="text-sm text-gray-500">{summary.totalHours}h total</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Absent</p>
                                <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                                <p className="text-sm text-gray-500">0% of total</p>
                            </div>
                            <UserX className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Morning Shift</p>
                                <p className="text-2xl font-bold text-blue-600">{summary.morningShift}</p>
                                <p className="text-sm text-gray-500">records</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shift Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Morning Shift</p>
                                <p className="text-2xl font-bold text-blue-600">{summary.morningShift}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Evening Shift</p>
                                <p className="text-2xl font-bold text-orange-600">{summary.eveningShift}</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Night Shift</p>
                                <p className="text-2xl font-bold text-purple-600">{summary.nightShift}</p>
                            </div>
                            <Clock className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by name, email, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </Button>
                </div>
            </div>

            {/* AG Grid */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loading />
                        </div>
                    ) : (
                        <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
                            <AgGridReact
                                columnDefs={columnDefs}
                                rowData={filteredData}
                                gridOptions={gridOptions}
                                defaultColDef={gridOptions.defaultColDef}
                                pagination={gridOptions.pagination}
                                paginationPageSize={gridOptions.paginationPageSize}
                                rowHeight={gridOptions.rowHeight}
                                animateRows={gridOptions.animateRows}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Attendance Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Edit Attendance Record</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Employee: {selectedAttendance?.employeeId?.name || 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Employee Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <Input
                                            value={selectedAttendance?.employeeId?.name || 'N/A'}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <Input
                                            value={selectedAttendance?.employeeId?.email || 'N/A'}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                                        <Input
                                            value={selectedAttendance?.managerId?.name || 'N/A'}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {selectedAttendance?.status || 'Present'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Details */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Step In Time *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="datetime-local"
                                                value={editForm.stepIn}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, stepIn: e.target.value }))}
                                                className="pr-10"
                                            />
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Step Out Time
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="datetime-local"
                                                value={editForm.stepOut}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, stepOut: e.target.value }))}
                                                placeholder="mm/dd/yyyy --:-- --"
                                                className="pr-10"
                                            />
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Leave empty if employee hasn't clocked out</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Shift *
                                            </label>
                                            <select
                                                value={editForm.shift}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="morning">Morning</option>
                                                <option value="evening">Evening</option>
                                                <option value="night">Night</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status
                                            </label>
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="late">Late</option>
                                                <option value="half-day">Half Day</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                        </label>
                                        <Input
                                            value={editForm.address}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Enter location"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Note
                                        </label>
                                        <textarea
                                            value={editForm.note}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Enter any additional notes"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveAttendance}
                                className="flex items-center space-x-2"
                            >
                                <Save className="h-4 w-4" />
                                <span>Save Changes</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceManagement;
