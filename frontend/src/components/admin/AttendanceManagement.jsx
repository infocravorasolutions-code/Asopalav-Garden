// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import {
//     Search,
//     Filter,
//     RefreshCw,
//     FileText,
//     Download,
//     Clock,
//     Users,
//     UserCheck,
//     UserX,
//     MapPin,
//     Calendar,
//     TrendingUp,
//     X,
//     Save,
//     ChevronLeft,
//     ChevronRight
// } from 'lucide-react';
// import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
// import Button from '../ui/Button';
// import Input from '../ui/Input';
// import Loading from '../ui/Loading';
// import Pagination from '../ui/Pagination';
// import { adminAPI, api } from '../../services/api';
// import { getApiUrl } from '../../config/environment';
// import CopyCellRenderer from '../ui/CopyCellRenderer';
// import toast from 'react-hot-toast';
// import { SHIFT_ENUM } from '../../constants/shifts';


// const AttendanceManagement = () => {
//     // Predefined locations with full addresses that managers can select from dropdown
//     const predefinedLocations = [
//         { 
//             name: 'Riverfront west side સી plan', 
//             address: 'unnamed road, Ranna Park, - 380007, Gujarat, India'
//         },
//         { 
//             name: 'Flower park Point 2 Gate 2', 
//             address: 'Sabarmati Riverfront road, Kochrab, - 380043, Gujarat, India'
//         },
//         { 
//             name: 'Flower park point 1 Gate 1', 
//             address: 'Sabarmati Riverfront Road, Paldi, Navrangpura - 380006, Gujarat, India'
//         },
//         { 
//             name: 'Flower park point 3 Gate 3', 
//             address: 'Sabarmati Riverfront road, Kochrab, - 380043, Gujarat, India'
//         },
//         { 
//             name: 'Shbhas Garden Park point 1 gate 2', 
//             address: 'Sabarmati Riverfront Promenade, Dudheshwar, - 380014, Gujarat, India'
//         },
//         { 
//             name: 'Shbhas Garden Point 2 Gate 1', 
//             address: 'Riverfront Road, Dudheshwar, - 380027, Gujarat, India'
//         }
//     ];

//     // Function to check if address matches a predefined location
//     const getSelectedLocation = (address) => {
//         if (!address) return 'Not Assigned';
        
//         // Check if the address exactly matches any predefined location address
//         const matchedLocation = predefinedLocations.find(location => 
//             address === location.address || address.includes(location.address)
//         );
        
//         return matchedLocation ? matchedLocation.name : 'Not Assigned';
//     };

//     const [attendanceData, setAttendanceData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [pagination, setPagination] = useState({
//         currentPage: 1,
//         totalPages: 1,
//         totalRecords: 0,
//         limit: 50,
//         hasNextPage: false,
//         hasPrevPage: false
//     });
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filters, setFilters] = useState({
//         manager: '',
//         employee: '',
//         shift: '',
//         status: '',
//         assignedSite: '',
//         startDate: '',
//         endDate: ''
//     });
//     const [showFilters, setShowFilters] = useState(false);
//     const [managers, setManagers] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [summary, setSummary] = useState({
//         totalRecords: 0,
//         present: 0,
//         absent: 0,
//         totalHours: 0,
//         morningShift: 0,
//         eveningShift: 0,
//         nightShift: 0
//     });
//     const [editModalOpen, setEditModalOpen] = useState(false);
//     const [selectedAttendance, setSelectedAttendance] = useState(null);
//     const [editForm, setEditForm] = useState({
//         stepIn: '',
//         stepOut: '',
//         shift: SHIFT_ENUM.MORNING,
//         status: 'present',
//         address: '',
//         note: ''
//     });


//     // Fetch managers and employees for filter dropdowns
//     const fetchFilterData = async () => {
//         try {
//             // Fetch managers
//             const managersResponse = await adminAPI.getManagers();
//             setManagers(managersResponse.managers || []);

//             // Fetch employees
//             const employeesResponse = await adminAPI.getEmployees();
//             setEmployees(employeesResponse.employees || []);
//         } catch (error) {
//             console.error('Error fetching filter data:', error);
//         }
//     };

//     // Fetch attendance data
//     const fetchAttendanceData = useCallback(async (page = 1) => {
//         setLoading(true);
//         try {
//             const params = new URLSearchParams();
//             Object.entries(filters).forEach(([key, value]) => {
//                 if (value) params.append(key, value);
//             });

//             // Add pagination parameters
//             params.append('page', page.toString());
//             params.append('limit', pagination.limit.toString());

//             const response = await adminAPI.getAttendance(params);
//             const data = response.attendance || [];

//             setAttendanceData(data);

//             // Update pagination state
//             if (response.pagination) {
//                 setPagination(response.pagination);
//             }

//             // Calculate summary
//             const summary = calculateSummary(data);
//             setSummary(summary);
//         } catch (error) {
//             console.error('Error fetching attendance data:', error);
//             toast.error('Failed to fetch attendance data');
//         } finally {
//             setLoading(false);
//         }
//     }, [filters, pagination.limit]);

//     // Calculate summary statistics
//     const calculateSummary = (data) => {
//         const totalRecords = data.length;
//         const present = data.filter(record => record.status === 'present').length;
//         const absent = data.filter(record => record.status === 'absent').length;
//         const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0) / 60;

//         const morningShift = data.filter(record => record.shift === SHIFT_ENUM.MORNING).length;
//         const eveningShift = data.filter(record => record.shift === SHIFT_ENUM.EVENING).length;
//         const nightShift = data.filter(record => record.shift === SHIFT_ENUM.NIGHT).length;

//         return {
//             totalRecords,
//             present,
//             absent,
//             totalHours: totalHours.toFixed(1),
//             morningShift,
//             eveningShift,
//             nightShift
//         };
//     };

//     // Filter data based on search term and other filters
//     const filteredData = useMemo(() => {
//         let filtered = attendanceData;

//         // Apply search term filter
//         if (searchTerm) {
//             filtered = filtered.filter(record => {
//                 const employee = record.employeeId;
//                 const searchLower = searchTerm.toLowerCase();
//                 return (
//                     employee?.name?.toLowerCase().includes(searchLower) ||
//                     employee?.email?.toLowerCase().includes(searchLower) ||
//                     record.address?.toLowerCase().includes(searchLower)
//                 );
//             });
//         }

//         // Apply assigned site filter
//         if (filters.assignedSite) {
//             filtered = filtered.filter(record => {
//                 const selectedLocation = getSelectedLocation(record.address);
//                 return selectedLocation === filters.assignedSite;
//             });
//         }

//         // Apply manager filter
//         if (filters.manager) {
//             filtered = filtered.filter(record => {
//                 return record.managerId?._id === filters.manager;
//             });
//         }

//         // Apply employee filter
//         if (filters.employee) {
//             filtered = filtered.filter(record => {
//                 return record.employeeId?._id === filters.employee;
//             });
//         }

//         // Apply shift filter
//         if (filters.shift) {
//             filtered = filtered.filter(record => {
//                 return record.shift === filters.shift;
//             });
//         }

//         // Apply status filter
//         if (filters.status) {
//             filtered = filtered.filter(record => {
//                 return record.status === filters.status;
//             });
//         }

//         // Apply date range filter
//         if (filters.startDate) {
//             const startDate = new Date(filters.startDate);
//             filtered = filtered.filter(record => {
//                 const recordDate = new Date(record.stepIn);
//                 return recordDate >= startDate;
//             });
//         }

//         if (filters.endDate) {
//             const endDate = new Date(filters.endDate);
//             endDate.setHours(23, 59, 59, 999); // Include the entire end date
//             filtered = filtered.filter(record => {
//                 const recordDate = new Date(record.stepIn);
//                 return recordDate <= endDate;
//             });
//         }

//         return filtered;
//     }, [attendanceData, searchTerm, filters]);

//     // Export to Excel
//     const exportToExcel = async () => {
//         try {
//             const params = new URLSearchParams();
//             Object.entries(filters).forEach(([key, value]) => {
//                 if (value) params.append(key, value);
//             });

//             const response = await api.get(`/attendence/export/excel?${params.toString()}`, {
//                 responseType: 'blob'
//             });

//             if (response.status === 200) {
//                 const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//                 const url = window.URL.createObjectURL(blob);
//                 const link = document.createElement('a');
//                 link.href = url;
//                 link.download = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
//                 document.body.appendChild(link);
//                 link.click();
//                 link.remove();
//                 window.URL.revokeObjectURL(url);
//                 toast.success('Attendance data exported to Excel successfully!');
//             }
//         } catch (error) {
//             console.error('Error exporting to Excel:', error);
//             toast.error('Failed to export attendance data to Excel');
//         }
//     };

//     // Export to PDF using enhanced professional export
//     const exportToPDF = async () => {
//         try {

//             if (!attendanceData || attendanceData.length === 0) {
//                 toast.error('No attendance data to export');
//                 return;
//             }

//             // Import the enhanced PDF export utility
//             let exportAttendanceToPDF;
//             try {
//                 const pdfUtils = await import('../../utils/pdfExportUtils');
//                 exportAttendanceToPDF = pdfUtils.exportAttendanceToPDF || pdfUtils.default?.exportAttendanceToPDF;

//                 if (!exportAttendanceToPDF) {
//                     throw new Error('PDF export function not found');
//                 }
//             } catch (error) {
//                 console.error('Error importing PDF utils:', error);
//                 toast.error('Failed to load PDF export utility. Please try again.');
//                 return;
//             }

//             // Create filename with timestamp
//             const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//             const filename = `attendance_${timestamp}.pdf`;

//             // Use the enhanced PDF export function
//             await exportAttendanceToPDF(attendanceData, filename);

//             // Show success message
//             const isWebView = window.ReactNativeWebView !== undefined;
//             if (isWebView) {
//                 toast.success('Professional PDF export initiated in mobile app');
//             } else {
//                 toast.success('Professional PDF exported successfully');
//             }

//         } catch (error) {
//             console.error('Error exporting to PDF:', error);
//             toast.error('Failed to export PDF: ' + error.message);
//         }
//     };

//     // Handle edit attendance
//     const handleEditAttendance = (attendance) => {
//         setSelectedAttendance(attendance);
//         setEditForm({
//             stepIn: attendance.stepIn ? new Date(attendance.stepIn).toISOString().slice(0, 16) : '',
//             stepOut: attendance.stepOut ? new Date(attendance.stepOut).toISOString().slice(0, 16) : '',
//             shift: attendance.shift || SHIFT_ENUM.MORNING,
//             status: attendance.status || 'present',
//             address: attendance.address || '',
//             note: attendance.note || ''
//         });
//         setEditModalOpen(true);
//     };

//     // Handle delete attendance
//     const handleDeleteAttendance = async (attendance) => {
//         if (window.confirm('Are you sure you want to delete this attendance record?')) {
//             try {
//                 await adminAPI.deleteAttendance(attendance._id);
//                 await fetchAttendanceData();
//                 alert('Attendance record deleted successfully');
//             } catch (error) {
//                 console.error('Error deleting attendance:', error);
//                 alert('Error deleting attendance record');
//             }
//         }
//     };

//     // Handle save attendance changes
//     const handleSaveAttendance = async () => {
//         try {
//             const updateData = {
//                 stepIn: editForm.stepIn ? new Date(editForm.stepIn) : null,
//                 stepOut: editForm.stepOut ? new Date(editForm.stepOut) : null,
//                 shift: editForm.shift,
//                 status: editForm.status,
//                 address: editForm.address,
//                 note: editForm.note
//             };

//             await adminAPI.updateAttendance(selectedAttendance._id, updateData);
//             await fetchAttendanceData();
//             setEditModalOpen(false);
//             alert('Attendance record updated successfully');
//         } catch (error) {
//             console.error('Error updating attendance:', error);
//             alert('Error updating attendance record');
//         }
//     };

//     // Handle filter changes
//     const handleFilterChange = (key, value) => {
//         setFilters(prev => ({
//             ...prev,
//             [key]: value
//         }));
//     };

//     // Clear all filters
//     const clearFilters = () => {
//         setFilters({
//             manager: '',
//             employee: '',
//             shift: '',
//             status: '',
//             assignedSite: '',
//             startDate: '',
//             endDate: ''
//         });
//     };

//     // Apply filters
//     const applyFilters = () => {
//         fetchAttendanceData();
//         setShowFilters(false);
//     };

//     // Load data on component mount
//     useEffect(() => {
//         fetchFilterData();
//         fetchAttendanceData();
//     }, [fetchAttendanceData]);

//     return (
//         <div className="space-y-4 sm:space-y-6">
//             {/* Page Header */}
//             <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
//                 <div className="min-w-0 flex-1">
//                     <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Attendance Management</h1>
//                     <p className="text-sm sm:text-base text-gray-600 mt-1">
//                         Monitor and manage employee attendance records
//                     </p>
//                 </div>

//                 {/* Mobile Layout - Stacked buttons */}
//                 <div className="flex flex-col space-y-2 sm:hidden">
//                     <div className="flex items-center space-x-2">
//                         <Button
//                             onClick={() => fetchAttendanceData()}
//                             variant="outline"
//                             className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] flex-1"
//                         >
//                             <RefreshCw className="h-4 w-4" />
//                             <span>Refresh</span>
//                         </Button>
//                         <Button
//                             onClick={exportToExcel}
//                             className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] flex-1"
//                         >
//                             <FileText className="h-4 w-4" />
//                             <span>Excel</span>
//                         </Button>
//                     </div>
//                     <Button
//                         onClick={exportToPDF}
//                         variant="outline"
//                         className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] w-full"
//                     >
//                         <Download className="h-4 w-4" />
//                         <span>Export PDF</span>
//                     </Button>
//                 </div>

//                 {/* Desktop Layout - Horizontal buttons */}
//                 <div className="hidden sm:flex items-center space-x-2">
//                     <Button
//                         onClick={() => fetchAttendanceData()}
//                         variant="outline"
//                         className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
//                     >
//                         <RefreshCw className="h-4 w-4" />
//                         <span>Refresh</span>
//                     </Button>
//                     <Button
//                         onClick={exportToExcel}
//                         className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
//                     >
//                         <FileText className="h-4 w-4" />
//                         <span>Export Excel</span>
//                     </Button>
//                     <Button
//                         onClick={exportToPDF}
//                         variant="outline"
//                         className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
//                     >
//                         <Download className="h-4 w-4" />
//                         <span>Export PDF</span>
//                     </Button>
//                 </div>
//             </div>

//             {/* Summary Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
//                 <Card>
//                     <CardContent className="p-3 sm:p-4">
//                         <div className="flex items-center justify-between">
//                             <div className="min-w-0 flex-1">
//                                 <p className="text-xs sm:text-sm font-medium text-gray-600">Absent</p>
//                                 <p className="text-lg sm:text-2xl font-bold text-red-600">{summary.absent}</p>
//                                 <p className="text-xs sm:text-sm text-gray-500">0% of total</p>
//                             </div>
//                             <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-3 sm:p-4">
//                         <div className="flex items-center justify-between">
//                             <div className="min-w-0 flex-1">
//                                 <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Hours</p>
//                                 <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.totalHours}h</p>
//                                 <p className="text-xs sm:text-sm text-gray-500">per employee</p>
//                             </div>
//                             <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-3 sm:p-4">
//                         <div className="flex items-center justify-between">
//                             <div className="min-w-0 flex-1">
//                                 <p className="text-xs sm:text-sm font-medium text-gray-600">Morning Shift</p>
//                                 <p className="text-lg sm:text-2xl font-bold text-blue-600">{summary.morningShift}</p>
//                             </div>
//                             <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-3 sm:p-4">
//                         <div className="flex items-center justify-between">
//                             <div className="min-w-0 flex-1">
//                                 <p className="text-xs sm:text-sm font-medium text-gray-600">Evening Shift</p>
//                                 <p className="text-lg sm:text-2xl font-bold text-orange-600">{summary.eveningShift}</p>
//                             </div>
//                             <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-3 sm:p-4">
//                         <div className="flex items-center justify-between">
//                             <div className="min-w-0 flex-1">
//                                 <p className="text-xs sm:text-sm font-medium text-gray-600">Night Shift</p>
//                                 <p className="text-lg sm:text-2xl font-bold text-purple-600">{summary.nightShift}</p>
//                             </div>
//                             <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Search and Filters */}
//             <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
//                 <div className="flex-1">
//                     <div className="relative">
//                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
//                         <Input
//                             type="text"
//                             placeholder="Search by name, email, or Ic"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             className="pl-10 pr-4 w-full touch-manipulation min-h-[44px] text-sm sm:text-base"
//                             style={{ paddingLeft: '2.5rem' }}
//                         />
//                     </div>
//                 </div>
//                 <div className="flex space-x-2">
//                     <Button
//                         variant="outline"
//                         onClick={() => setShowFilters(!showFilters)}
//                         className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] w-full sm:w-auto"
//                     >
//                         <Filter className="h-4 w-4" />
//                         <span>Filters</span>
//                     </Button>
//                 </div>
//             </div>

//             {/* Filter Panel */}
//             {showFilters && (
//                 <Card className="p-6">
//                     <div className="space-y-4">
//                         <h3 className="text-lg font-semibold text-gray-900">Filters</h3>

//                         {/* Filter Row 1 */}
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
//                                 <select
//                                     value={filters.manager}
//                                     onChange={(e) => handleFilterChange('manager', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 >
//                                     <option value="">All Managers</option>
//                                     {managers.map(manager => (
//                                         <option key={manager._id} value={manager._id}>
//                                             {manager.name}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
//                                 <select
//                                     value={filters.employee}
//                                     onChange={(e) => handleFilterChange('employee', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 >
//                                     <option value="">All Employees</option>
//                                     {employees.map(employee => (
//                                         <option key={employee._id} value={employee._id}>
//                                             {employee.name} ({employee.empCode})
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
//                                 <select
//                                     value={filters.shift}
//                                     onChange={(e) => handleFilterChange('shift', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 >
//                                     <option value="">All Shifts</option>
//                                     <option value="morning">Morning</option>
//                                     <option value="evening">Evening</option>
//                                     <option value="night">Night</option>
//                                 </select>
//                             </div>
//                         </div>

//                         {/* Filter Row 2 */}
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                                 <select
//                                     value={filters.status}
//                                     onChange={(e) => handleFilterChange('status', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 >
//                                     <option value="">All Status</option>
//                                     <option value="present">Present</option>
//                                     <option value="absent">Absent</option>
//                                     <option value="late">Late</option>
//                                     <option value="half-day">Half Day</option>
//                                 </select>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Site</label>
//                                 <select
//                                     value={filters.assignedSite}
//                                     onChange={(e) => handleFilterChange('assignedSite', e.target.value)}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 >
//                                     <option value="">All Sites</option>
//                                     {predefinedLocations.map((location, index) => (
//                                         <option key={index} value={location.name}>
//                                             {location.name}
//                                         </option>
//                                     ))}
//                                     <option value="Not Assigned">Not Assigned</option>
//                                 </select>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
//                                 <Input
//                                     type="date"
//                                     value={filters.startDate}
//                                     onChange={(e) => handleFilterChange('startDate', e.target.value)}
//                                     className="w-full"
//                                 />
//                             </div>
//                         </div>

//                         {/* Filter Row 3 */}
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
//                                 <Input
//                                     type="date"
//                                     value={filters.endDate}
//                                     onChange={(e) => handleFilterChange('endDate', e.target.value)}
//                                     className="w-full"
//                                 />
//                             </div>
//                         </div>

//                         {/* Filter Actions */}
//                         <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
//                             <Button
//                                 variant="outline"
//                                 onClick={clearFilters}
//                                 className="px-4 py-2"
//                             >
//                                 Clear
//                             </Button>
//                             <Button
//                                 onClick={applyFilters}
//                                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
//                             >
//                                 Apply Filters
//                             </Button>
//                         </div>
//                     </div>
//                 </Card>
//             )}

//             {/* Attendance Records */}
//             <Card className="flex-1 min-h-0">
//                 <CardContent className="p-0 h-full flex flex-col">
//                     {loading ? (
//                         <div className="flex justify-center items-center py-12">
//                             <Loading />
//                         </div>
//                     ) : filteredData.length === 0 ? (
//                         <div className="flex flex-col items-center justify-center py-12 text-gray-500">
//                             <Users className="h-12 w-12 mb-4 text-gray-300" />
//                             <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
//                             <p className="text-sm text-gray-600 mb-4">
//                                 {attendanceData.length === 0
//                                     ? 'No attendance records found. Try refreshing the data.'
//                                     : 'No records match your current search criteria.'
//                                 }
//                             </p>
//                             <Button
//                                 onClick={fetchAttendanceData}
//                                 variant="outline"
//                                 className="flex items-center space-x-2"
//                             >
//                                 <RefreshCw className="h-4 w-4" />
//                                 <span>Refresh Data</span>
//                             </Button>
//                         </div>
//                     ) : (
//                         <div className="flex-1 min-h-0 overflow-y-auto">
//                             {/* Desktop Table View */}
//                             <div className="hidden md:block">
//                                 <div className="overflow-x-auto">
//                                     <table className="min-w-full divide-y divide-gray-200">
//                                         <thead className="bg-gray-50">
//                                             <tr>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Employee
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Date
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Shift
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Clock In
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Clock Out
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Status
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Location
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Assigned Site
//                                                 </th>
//                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Actions
//                                                 </th>
//                                             </tr>
//                                         </thead>
//                                         <tbody className="bg-white divide-y divide-gray-200">
//                                             {filteredData.map((record, index) => {
//                                                 const employee = record.employeeId;
//                                                 const getStatusColor = (status) => {
//                                                     switch (status) {
//                                                         case 'present': return 'bg-green-100 text-green-800';
//                                                         case 'absent': return 'bg-red-100 text-red-800';
//                                                         case 'late': return 'bg-orange-100 text-orange-800';
//                                                         case 'half-day': return 'bg-blue-100 text-blue-800';
//                                                         default: return 'bg-gray-100 text-gray-800';
//                                                     }
//                                                 };
//                                                 const getShiftColor = (shift) => {
//                                                     switch (shift) {
//                                                         case 'morning': return 'bg-blue-100 text-blue-800';
//                                                         case 'evening': return 'bg-orange-100 text-orange-800';
//                                                         case 'night': return 'bg-purple-100 text-purple-800';
//                                                         default: return 'bg-gray-100 text-gray-800';
//                                                     }
//                                                 };

//                                                 return (
//                                                     <tr key={record._id || index} className="hover:bg-gray-50">
//                                                         <td className="px-6 py-4 whitespace-nowrap">
//                                                             <div className="flex items-center">
//                                                                 <div className="flex-shrink-0 h-10 w-10 relative">
//                                                                     {employee?.photo ? (
//                                                                         <img
//                                                                             src={employee.photo.startsWith('data:')
//                                                                                 ? employee.photo
//                                                                                 : employee.photo.startsWith('http')
//                                                                                     ? employee.photo
//                                                                                     : `${getApiUrl().replace('/api', '')}/static/${employee.photo}`
//                                                                             }
//                                                                             alt={employee?.name || 'Employee'}
//                                                                             className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 absolute top-0 left-0 z-10"
//                                                                             onError={(e) => {
//                                                                                 // Fallback to placeholder if image fails to load
//                                                                                 e.target.style.display = 'none';
//                                                                                 e.target.nextElementSibling.style.display = 'flex';
//                                                                             }}
//                                                                         />
//                                                                     ) : null}
//                                                                     <div
//                                                                         className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${employee?.photo ? 'hidden' : 'flex'
//                                                                             }`}
//                                                                     >
//                                                                         <span className="text-blue-600 font-semibold text-sm">
//                                                                             {employee?.name?.charAt(0) || 'N/A'}
//                                                                         </span>
//                                                                     </div>
//                                                                 </div>
//                                                                 <div className="ml-4">
//                                                                     <div className="text-sm font-medium text-gray-900">
//                                                                         {employee?.name || 'N/A'}
//                                                                     </div>
//                                                                     <div className="text-sm text-gray-500">
//                                                                         {employee?.empCode || 'N/A'}
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         </td>
//                                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                                                             {new Date(record.stepIn).toLocaleDateString()}
//                                                         </td>
//                                                         <td className="px-6 py-4 whitespace-nowrap">
//                                                             <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(record.shift)}`}>
//                                                                 {record.shift || 'N/A'}
//                                                             </span>
//                                                         </td>
//                                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                                                             {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', {
//                                                                 hour: 'numeric',
//                                                                 minute: '2-digit',
//                                                                 hour12: true
//                                                             }) : 'N/A'}
//                                                         </td>
//                                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                                                             {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', {
//                                                                 hour: 'numeric',
//                                                                 minute: '2-digit',
//                                                                 hour12: true
//                                                             }) : 'N/A'}
//                                                         </td>
//                                                         <td className="px-6 py-4 whitespace-nowrap">
//                                                             <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
//                                                                 {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
//                                                             </span>
//                                                         </td>
//                                                         <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={record.address || 'N/A'}>
//                                                             {record.address || 'N/A'}
//                                                         </td>
//                                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                                                             <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
//                                                                 {getSelectedLocation(record.address)}
//                                                             </span>
//                                                         </td>
//                                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                                                             <div className="flex space-x-2">
//                                                                 <button
//                                                                     onClick={() => handleEditAttendance(record)}
//                                                                     className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
//                                                                 >
//                                                                     Edit
//                                                                 </button>
//                                                                 <button
//                                                                     onClick={() => handleDeleteAttendance(record)}
//                                                                     className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs"
//                                                                 >
//                                                                     Delete
//                                                                 </button>
//                                                             </div>
//                                                         </td>
//                                                     </tr>
//                                                 );
//                                             })}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>

//                             {/* Mobile Card View */}
//                             <div className="md:hidden space-y-4 p-4">
//                                 {filteredData.map((record, index) => {
//                                     const employee = record.employeeId;
//                                     const getStatusColor = (status) => {
//                                         switch (status) {
//                                             case 'present': return 'bg-green-100 text-green-800';
//                                             case 'absent': return 'bg-red-100 text-red-800';
//                                             case 'late': return 'bg-orange-100 text-orange-800';
//                                             case 'half-day': return 'bg-blue-100 text-blue-800';
//                                             default: return 'bg-gray-100 text-gray-800';
//                                         }
//                                     };
//                                     const getShiftColor = (shift) => {
//                                         switch (shift) {
//                                             case 'morning': return 'bg-blue-100 text-blue-800';
//                                             case 'evening': return 'bg-orange-100 text-orange-800';
//                                             case 'night': return 'bg-purple-100 text-purple-800';
//                                             default: return 'bg-gray-100 text-gray-800';
//                                         }
//                                     };

//                                     return (
//                                         <div key={record._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//                                             {/* Employee Info Header */}
//                                             <div className="flex items-start justify-between mb-3">
//                                                 <div className="flex items-center space-x-3 flex-1 min-w-0">
//                                                     <div className="relative flex-shrink-0">
//                                                         {employee?.photo ? (
//                                                             <img
//                                                                 src={employee.photo.startsWith('data:')
//                                                                     ? employee.photo
//                                                                     : employee.photo.startsWith('http')
//                                                                         ? employee.photo
//                                                                         : `${getApiUrl().replace('/api', '')}/static/${employee.photo}`
//                                                                 }
//                                                                 alt={employee?.name || 'Employee'}
//                                                                 className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
//                                                                 onError={(e) => {
//                                                                     e.target.style.display = 'none';
//                                                                     e.target.nextElementSibling.style.display = 'flex';
//                                                                 }}
//                                                             />
//                                                         ) : null}
//                                                         <div
//                                                             className={`h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center ${employee?.photo ? 'hidden' : 'flex'
//                                                                 }`}
//                                                         >
//                                                             <span className="text-blue-600 font-semibold text-lg">
//                                                                 {employee?.name?.charAt(0) || 'N/A'}
//                                                             </span>
//                                                         </div>
//                                                         {/* Status indicator */}
//                                                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
//                                                     </div>
//                                                     <div className="flex-1 min-w-0">
//                                                         <h3 className="text-base font-semibold text-gray-900 truncate">
//                                                             {employee?.name || 'N/A'}
//                                                         </h3>
//                                                         <p className="text-sm text-gray-600 truncate">
//                                                             {employee?.email || 'N/A'}
//                                                         </p>
//                                                     </div>
//                                                 </div>
//                                                 <div className="flex-shrink-0 ml-2">
//                                                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(record.status)}`}>
//                                                         {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
//                                                     </span>
//                                                 </div>
//                                             </div>

//                                             {/* Date and Shift */}
//                                             <div className="flex items-center space-x-4 mb-3">
//                                                 <div className="flex items-center space-x-1">
//                                                     <Calendar className="h-4 w-4 text-gray-400" />
//                                                     <span className="text-sm text-gray-600">
//                                                         {new Date(record.stepIn).toLocaleDateString()}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-1">
//                                                     <Clock className="h-4 w-4 text-gray-400" />
//                                                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(record.shift)}`}>
//                                                         {record.shift || 'N/A'}
//                                                     </span>
//                                                 </div>
//                                             </div>

//                                             {/* Timings */}
//                                             <div className="flex items-center space-x-4 mb-3">
//                                                 <div className="text-sm">
//                                                     <span className="text-gray-600">In: </span>
//                                                     <span className="font-medium text-gray-900">
//                                                         {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', {
//                                                             hour: 'numeric',
//                                                             minute: '2-digit',
//                                                             hour12: true
//                                                         }) : 'N/A'}
//                                                     </span>
//                                                 </div>
//                                                 <div className="text-sm">
//                                                     <span className="text-gray-600">Out: </span>
//                                                     <span className="font-medium text-gray-900">
//                                                         {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', {
//                                                             hour: 'numeric',
//                                                             minute: '2-digit',
//                                                             hour12: true
//                                                         }) : 'N/A'}
//                                                     </span>
//                                                 </div>
//                                             </div>

//                                             {/* Location */}
//                                             <div className="flex items-start space-x-2 mb-3">
//                                                 <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
//                                                 <span className="text-sm text-gray-600 flex-1">
//                                                     {record.address || 'N/A'}
//                                                 </span>
//                                             </div>

//                                             {/* Assigned Site */}
//                                             <div className="flex items-center space-x-2 mb-3">
//                                                 <span className="text-sm text-gray-600">Site:</span>
//                                                 <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
//                                                     {getSelectedLocation(record.address)}
//                                                 </span>
//                                             </div>

//                                             {/* Remarks */}
//                                             {record.note && (
//                                                 <div className="flex items-start space-x-2 mb-3">
//                                                     <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
//                                                     <span className="text-sm text-gray-600 flex-1">
//                                                         Remarks: {record.note}
//                                                     </span>
//                                                 </div>
//                                             )}

//                                             {/* Actions */}
//                                             <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
//                                                 <button
//                                                     onClick={() => handleEditAttendance(record)}
//                                                     className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
//                                                     title="Edit"
//                                                 >
//                                                     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                                                     </svg>
//                                                 </button>
//                                                 <button
//                                                     onClick={() => handleDeleteAttendance(record)}
//                                                     className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
//                                                     title="Delete"
//                                                 >
//                                                     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                                     </svg>
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>

//                             {/* Pagination Controls */}
//                             <Pagination
//                                 pagination={pagination}
//                                 onPageChange={fetchAttendanceData}
//                                 loading={loading}
//                                 className="px-6 py-4 border-t border-gray-200"
//                             />
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* Edit Attendance Modal */}
//             {editModalOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4">
//                     <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto h-[98vh] sm:h-[95vh] md:h-[90vh] flex flex-col overflow-hidden">
//                         {/* Modal Header */}
//                         <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
//                             <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
//                                 <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
//                                     <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
//                                 </div>
//                                 <div className="min-w-0 flex-1">
//                                     <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">Edit Attendance Record</h2>
//                                     <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
//                                         Employee: {selectedAttendance?.employeeId?.name || 'N/A'}
//                                     </p>
//                                 </div>
//                             </div>
//                             <button
//                                 onClick={() => setEditModalOpen(false)}
//                                 className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2 p-1"
//                             >
//                                 <X className="h-5 w-5 sm:h-6 sm:w-6" />
//                             </button>
//                         </div>

//                         {/* Modal Content */}
//                         <div className="flex-1 overflow-y-auto">
//                             <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
//                                 {/* Employee Information */}
//                                 <div>
//                                     <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
//                                         <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
//                                         <span>Employee Information</span>
//                                     </h3>
//                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                                             <Input
//                                                 value={selectedAttendance?.employeeId?.name || 'N/A'}
//                                                 disabled
//                                                 className="bg-gray-50 text-base sm:text-sm py-2.5 sm:py-2"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                                             <Input
//                                                 value={selectedAttendance?.employeeId?.email || 'N/A'}
//                                                 disabled
//                                                 className="bg-gray-50 text-base sm:text-sm py-2.5 sm:py-2"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
//                                             <Input
//                                                 value={selectedAttendance?.managerId?.name || 'N/A'}
//                                                 disabled
//                                                 className="bg-gray-50 text-base sm:text-sm py-2.5 sm:py-2"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
//                                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                                                 {selectedAttendance?.status || 'Present'}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Attendance Details */}
//                                 <div>
//                                     <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
//                                         <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
//                                         <span>Attendance Details</span>
//                                     </h3>
//                                     <div className="space-y-3 sm:space-y-4">
//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                 Step In Time *
//                                             </label>
//                                             <div className="relative">
//                                                 <Input
//                                                     type="datetime-local"
//                                                     value={editForm.stepIn}
//                                                     onChange={(e) => setEditForm(prev => ({ ...prev, stepIn: e.target.value }))}
//                                                     className="pr-10 text-base sm:text-sm py-2.5 sm:py-2"
//                                                 />
//                                                 <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                                             </div>
//                                         </div>

//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                 Step Out Time
//                                             </label>
//                                             <div className="relative">
//                                                 <Input
//                                                     type="datetime-local"
//                                                     value={editForm.stepOut}
//                                                     onChange={(e) => setEditForm(prev => ({ ...prev, stepOut: e.target.value }))}
//                                                     placeholder="mm/dd/yyyy --:-- --"
//                                                     className="pr-10 text-base sm:text-sm py-2.5 sm:py-2"
//                                                 />
//                                                 <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                                             </div>
//                                             <p className="text-xs sm:text-sm text-gray-500 mt-1">Leave empty if employee hasn't clocked out</p>
//                                         </div>

//                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                                             <div>
//                                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                     Shift *
//                                                 </label>
//                                                 <select
//                                                     value={editForm.shift}
//                                                     onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value }))}
//                                                     className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
//                                                 >
//                                                     <option value="morning">Morning</option>
//                                                     <option value="evening">Evening</option>
//                                                     <option value="night">Night</option>
//                                                 </select>
//                                             </div>

//                                             <div>
//                                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                     Status
//                                                 </label>
//                                                 <select
//                                                     value={editForm.status}
//                                                     onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
//                                                     className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
//                                                 >
//                                                     <option value="present">Present</option>
//                                                     <option value="absent">Absent</option>
//                                                     <option value="late">Late</option>
//                                                     <option value="half-day">Half Day</option>
//                                                 </select>
//                                             </div>
//                                         </div>

//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                 Location
//                                             </label>
//                                             <Input
//                                                 value={editForm.address}
//                                                 onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
//                                                 placeholder="Enter location"
//                                                 className="text-base sm:text-sm py-2.5 sm:py-2"
//                                             />
//                                         </div>

//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                 Note
//                                             </label>
//                                             <textarea
//                                                 value={editForm.note}
//                                                 onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
//                                                 rows={3}
//                                                 className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base sm:text-sm"
//                                                 placeholder="Enter any additional notes"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             {/* Add bottom padding to ensure content is fully visible */}
//                             <div className="h-4 sm:h-6"></div>
//                         </div>

//                         {/* Modal Footer */}
//                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
//                             <Button
//                                 variant="outline"
//                                 onClick={() => setEditModalOpen(false)}
//                                 className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium"
//                             >
//                                 Cancel
//                             </Button>
//                             <Button
//                                 onClick={handleSaveAttendance}
//                                 className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 sm:py-2 text-sm sm:text-base font-medium"
//                             >
//                                 <span>Save Changes</span>
//                             </Button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AttendanceManagement;


import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Save,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import Pagination from '../ui/Pagination';
import { adminAPI, api } from '../../services/api';
import { getApiUrl } from '../../config/environment';
import CopyCellRenderer from '../ui/CopyCellRenderer';
import toast from 'react-hot-toast';
import { SHIFT_ENUM, shortShiftName } from '../../constants/shifts';
import { useAuth } from '../../contexts/AuthContext';

const ATTENDANCE_TIME_ZONE = 'Asia/Kolkata';

function toIstDateTimeLocal(value) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ATTENDANCE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

function fromIstDateTimeLocal(value) {
  if (!value) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}+05:30`);
}

function toIstDateString(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ATTENDANCE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function formatIstDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US', {
    timeZone: ATTENDANCE_TIME_ZONE,
  });
}

const AttendanceManagement = () => {
    const { user } = useAuth();
    
    // Check if user is readonly admin
    const isReadOnlyAdmin = user?.role === 'readonly';
    
    // Dynamic sites and points from backend
    const [sites, setSites] = useState([]);
    const [loadingSites, setLoadingSites] = useState(false);

    // Function to check if address matches a site or point
    const getSelectedLocation = (address) => {
        if (!address) return 'Not Assigned';
        
        // Check if the address matches any site address
        const matchedSite = sites.find(site => 
            address === site.address || address.includes(site.address)
        );
        
        if (matchedSite) {
            return matchedSite.name;
        }
        
        // Check if the address matches any point address within sites
        for (const site of sites) {
            if (site.points && site.points.length > 0) {
                const matchedPoint = site.points.find(point => 
                    address === point.address || address.includes(point.address)
                );
                if (matchedPoint) {
                    return `${site.name} - ${matchedPoint.name}`;
                }
            }
        }
        
        return 'Not Assigned';
    };

    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 50,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        manager: '',
        employee: '',
        shift: '',
        status: '',
        assignedSite: '',
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [managers, setManagers] = useState([]);
    const [employees, setEmployees] = useState([]);
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
        shift: SHIFT_ENUM.MORNING,
        status: 'present',
        address: '',
        note: ''
    });


    // Fetch sites from backend
    const fetchSites = async () => {
        try {
            setLoadingSites(true);
            const response = await adminAPI.getSites();
            if (response.success && response.data) {
                setSites(response.data);
            } else {
                setSites([]);
            }
        } catch (error) {
            console.error('Error fetching sites:', error);
            setSites([]);
        } finally {
            setLoadingSites(false);
        }
    };

    // Fetch managers and employees for filter dropdowns
    const fetchFilterData = async () => {
        try {
            // Fetch managers
            const managersResponse = await adminAPI.getManagers();
            setManagers(managersResponse.managers || []);

            // Fetch employees
            const employeesResponse = await adminAPI.getEmployees();
            setEmployees(employeesResponse.employees || []);
        } catch (error) {
            console.error('Error fetching filter data:', error);
        }
    };

    // Fetch attendance data
    const fetchAttendanceData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            // Add pagination parameters
            params.append('page', page.toString());
            params.append('limit', pagination.limit.toString());

            const response = await adminAPI.getAttendance(params);
            const data = response.attendance || [];

            setAttendanceData(data);

            // Update pagination state
            if (response.pagination) {
                setPagination(response.pagination);
            }

            // Calculate summary
            const summary = calculateSummary(data);
            setSummary(summary);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            toast.error('Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    // Calculate summary statistics
    const calculateSummary = (data) => {
        const totalRecords = data.length;
        const present = data.filter(record => record.status === 'present').length;
        const absent = data.filter(record => record.status === 'absent').length;
        const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0) / 60;

        const morningShift = data.filter(record => record.shift === SHIFT_ENUM.MORNING).length;
        const eveningShift = data.filter(record => record.shift === SHIFT_ENUM.EVENING).length;
        const nightShift = data.filter(record => record.shift === SHIFT_ENUM.NIGHT).length;

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

    // Filter data based on search term and other filters
    const filteredData = useMemo(() => {
        let filtered = attendanceData;

        // Apply search term filter
        if (searchTerm) {
            filtered = filtered.filter(record => {
                const employee = record.employeeId;
                const searchLower = searchTerm.toLowerCase();
                return (
                    employee?.name?.toLowerCase().includes(searchLower) ||
                    employee?.email?.toLowerCase().includes(searchLower) ||
                    record.address?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Apply assigned site filter
        if (filters.assignedSite) {
            filtered = filtered.filter(record => {
                const selectedLocation = getSelectedLocation(record.address);
                return selectedLocation === filters.assignedSite;
            });
        }

        // Apply manager filter
        if (filters.manager) {
            filtered = filtered.filter(record => {
                return record.managerId?._id === filters.manager;
            });
        }

        // Apply employee filter
        if (filters.employee) {
            filtered = filtered.filter(record => {
                return record.employeeId?._id === filters.employee;
            });
        }

        // Apply shift filter
        if (filters.shift) {
            filtered = filtered.filter(record => {
                return record.shift === filters.shift;
            });
        }

        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(record => {
                return record.status === filters.status;
            });
        }

        // Apply date range filter using IST calendar dates
        if (filters.startDate) {
            filtered = filtered.filter((record) => toIstDateString(record.stepIn) >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter((record) => toIstDateString(record.stepIn) <= filters.endDate);
        }

        return filtered;
    }, [attendanceData, searchTerm, filters]);

    // Export to Excel
    const exportToExcel = async () => {
        try {
            setLoading(true);
            toast.success('Preparing Excel export with all records...');
            
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            
            // Set limit to 0 to get ALL records for Excel export
            params.append('limit', '0');

            const response = await api.get(`/attendence/export/excel?${params.toString()}`, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance_${toIstDateString(new Date())}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('Attendance data exported to Excel successfully with all records!');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export attendance data to Excel');
        } finally {
            setLoading(false);
        }
    };

    // Export to PDF using enhanced professional export
    const exportToPDF = async () => {
        try {
            setLoading(true);
            toast.success('Fetching all attendance data for PDF export...');

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            params.append('limit', '0');

            const response = await adminAPI.getAttendance(params);
            let allAttendanceData = response.attendance || [];

            const selectedSiteFilter = filters.assignedSite || '';

            allAttendanceData = allAttendanceData.map((record) => {
                let reportSiteName = getSelectedLocation(record.address);
                if (reportSiteName === 'Not Assigned') {
                    reportSiteName = record.employeeId?.assignedSiteName || '';
                }
                if (!reportSiteName) {
                    reportSiteName = selectedSiteFilter || 'Not Assigned';
                }
                return { ...record, reportSiteName };
            });

            if (selectedSiteFilter) {
                allAttendanceData = allAttendanceData.filter((record) => {
                    const punchSite = getSelectedLocation(record.address);
                    const assignedName = record.employeeId?.assignedSiteName || '';
                    return (
                        punchSite === selectedSiteFilter ||
                        assignedName === selectedSiteFilter ||
                        (selectedSiteFilter.includes(' - ') && assignedName && selectedSiteFilter.startsWith(assignedName))
                    );
                });
            }

            if (!allAttendanceData || allAttendanceData.length === 0) {
                toast.error('No attendance data to export');
                setLoading(false);
                return;
            }

            let exportAttendanceToPDF;
            try {
                const pdfUtils = await import('../../utils/pdfExportUtils');
                exportAttendanceToPDF = pdfUtils.exportAttendanceToPDF || pdfUtils.default?.exportAttendanceToPDF;

                if (!exportAttendanceToPDF) {
                    throw new Error('PDF export function not found');
                }
            } catch (error) {
                console.error('Error importing PDF utils:', error);
                toast.error('Failed to load PDF export utility. Please try again.');
                setLoading(false);
                return;
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `attendance_${timestamp}.pdf`;
            const exportOptions = {};
            if (selectedSiteFilter) {
                exportOptions.subtitle = `Site: ${selectedSiteFilter}`;
            }

            await exportAttendanceToPDF(allAttendanceData, filename, exportOptions);

            toast.success(`Professional PDF exported successfully with ${allAttendanceData.length} records`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Failed to export PDF: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle edit attendance
    const handleEditAttendance = (attendance) => {
        setSelectedAttendance(attendance);
        setEditForm({
            stepIn: toIstDateTimeLocal(attendance.stepIn),
            stepOut: toIstDateTimeLocal(attendance.stepOut),
            shift: attendance.shift || SHIFT_ENUM.MORNING,
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
                stepIn: fromIstDateTimeLocal(editForm.stepIn),
                stepOut: fromIstDateTimeLocal(editForm.stepOut),
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

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            manager: '',
            employee: '',
            shift: '',
            status: '',
            assignedSite: '',
            startDate: '',
            endDate: ''
        });
    };

    // Apply filters
    const applyFilters = () => {
        fetchAttendanceData();
        setShowFilters(false);
    };

    // Load data on component mount
    useEffect(() => {
        fetchFilterData();
        fetchSites();
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Attendance Management</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Monitor and manage employee attendance records
                    </p>
                </div>

                {/* Mobile Layout - Stacked buttons - Hidden for readonly users */}
                {!isReadOnlyAdmin && (
                    <div className="flex flex-col space-y-2 sm:hidden">
                        <div className="flex items-center space-x-2">
                            <Button
                                onClick={() => fetchAttendanceData()}
                                variant="outline"
                                className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] flex-1"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span>Refresh</span>
                            </Button>
                            <Button
                                onClick={exportToExcel}
                                className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] flex-1"
                            >
                                <FileText className="h-4 w-4" />
                                <span>Excel</span>
                            </Button>
                        </div>
                        <Button
                            onClick={exportToPDF}
                            variant="outline"
                            className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] w-full"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export PDF</span>
                        </Button>
                    </div>
                )}

                {/* Desktop Layout - Horizontal buttons - Hidden for readonly users */}
                {!isReadOnlyAdmin && (
                    <div className="hidden sm:flex items-center space-x-2">
                        <Button
                            onClick={() => fetchAttendanceData()}
                            variant="outline"
                            className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Refresh</span>
                        </Button>
                        <Button
                            onClick={exportToExcel}
                            className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
                        >
                            <FileText className="h-4 w-4" />
                            <span>Export Excel</span>
                        </Button>
                        <Button
                            onClick={exportToPDF}
                            variant="outline"
                            className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export PDF</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Absent</p>
                                <p className="text-lg sm:text-2xl font-bold text-red-600">{summary.absent}</p>
                                <p className="text-xs sm:text-sm text-gray-500">0% of total</p>
                            </div>
                            <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Hours</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.totalHours}h</p>
                                <p className="text-xs sm:text-sm text-gray-500">per employee</p>
                            </div>
                            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Morning Shift</p>
                                <p className="text-lg sm:text-2xl font-bold text-blue-600">{summary.morningShift}</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Evening Shift</p>
                                <p className="text-lg sm:text-2xl font-bold text-orange-600">{summary.eveningShift}</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Night Shift</p>
                                <p className="text-lg sm:text-2xl font-bold text-purple-600">{summary.nightShift}</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters - Hidden for readonly users */}
            {!isReadOnlyAdmin && (
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or Ic"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 w-full touch-manipulation min-h-[44px] text-sm sm:text-base"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] w-full sm:w-auto"
                        >
                            <Filter className="h-4 w-4" />
                            <span>Filters</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Filter Panel - Hidden for readonly users */}
            {!isReadOnlyAdmin && showFilters && (
                <Card className="p-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>

                        {/* Filter Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                                <select
                                    value={filters.manager}
                                    onChange={(e) => handleFilterChange('manager', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Managers</option>
                                    {managers.map(manager => (
                                        <option key={manager._id} value={manager._id}>
                                            {manager.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                <select
                                    value={filters.employee}
                                    onChange={(e) => handleFilterChange('employee', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Employees</option>
                                    {employees.map(employee => (
                                        <option key={employee._id} value={employee._id}>
                                            {employee.name} ({employee.empCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                <select
                                    value={filters.shift}
                                    onChange={(e) => handleFilterChange('shift', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Shifts</option>
                                    <option value="morning">Morning</option>
                                    <option value="evening">Evening</option>
                                    <option value="night">Night</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="half-day">Half Day</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Site/Point</label>
                                <select
                                    value={filters.assignedSite}
                                    onChange={(e) => handleFilterChange('assignedSite', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loadingSites}
                                >
                                    <option value="">All Sites & Points</option>
                                    {sites.map((site) => (
                                        <React.Fragment key={site._id}>
                                            <option value={site.name} className="font-semibold">
                                                📍 {site.name} ({site.siteCode})
                                            </option>
                                            {site.points && site.points.length > 0 && site.points.map((point) => (
                                                <option key={point._id} value={`${site.name} - ${point.name}`}>
                                                    &nbsp;&nbsp;• {point.name} ({point.pointCode})
                                                </option>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    <option value="Not Assigned">Not Assigned</option>
                                </select>
                                {loadingSites && (
                                    <p className="text-xs text-gray-500 mt-1">Loading sites and points...</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Filter Row 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="px-4 py-2"
                            >
                                Clear
                            </Button>
                            <Button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Attendance Records */}
                <Card className="flex-1 min-h-0">
                    <CardContent className="p-0 h-full flex flex-col">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loading />
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Users className="h-12 w-12 mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {attendanceData.length === 0
                                        ? 'No attendance records found. Try refreshing the data.'
                                        : 'No records match your current search criteria.'
                                    }
                                </p>
                                <Button
                                    onClick={fetchAttendanceData}
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    <span>Refresh Data</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                {/* Desktop Table View */}
                                <div className="hidden md:block">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Employee
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Shift
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Clock In
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Clock Out
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Location
                                                    </th>
                                                    {!isReadOnlyAdmin && (
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Assigned Site
                                                        </th>
                                                    )}
                                                    {!isReadOnlyAdmin && (
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredData.map((record, index) => {
                                                    const employee = record.employeeId;
                                                    const getStatusColor = (status) => {
                                                        switch (status) {
                                                            case 'present': return 'bg-green-100 text-green-800';
                                                            case 'absent': return 'bg-red-100 text-red-800';
                                                            case 'late': return 'bg-orange-100 text-orange-800';
                                                            case 'half-day': return 'bg-blue-100 text-blue-800';
                                                            default: return 'bg-gray-100 text-gray-800';
                                                        }
                                                    };
                                                    const shiftLabel = shortShiftName(record.shift);
                                                    const getShiftColor = (label) => {
                                                        switch (label) {
                                                            case 'Morning': return 'bg-blue-100 text-blue-800';
                                                            case 'Evening': return 'bg-orange-100 text-orange-800';
                                                            case 'Night': return 'bg-purple-100 text-purple-800';
                                                            default: return 'bg-gray-100 text-gray-800';
                                                        }
                                                    };

                                                    return (
                                                        <tr key={record._id || index} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10 relative">
                                                                        {employee?.photo ? (
                                                                            <img
                                                                                src={employee.photo.startsWith('data:')
                                                                                    ? employee.photo
                                                                                    : employee.photo.startsWith('http')
                                                                                        ? employee.photo
                                                                                        : `${getApiUrl().replace('/api', '')}/static/${employee.photo}`
                                                                                }
                                                                                alt={employee?.name || 'Employee'}
                                                                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 absolute top-0 left-0 z-10"
                                                                                onError={(e) => {
                                                                                    // Fallback to placeholder if image fails to load
                                                                                    e.target.style.display = 'none';
                                                                                    e.target.nextElementSibling.style.display = 'flex';
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                        <div
                                                                            className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${employee?.photo ? 'hidden' : 'flex'
                                                                                }`}
                                                                        >
                                                                            <span className="text-blue-600 font-semibold text-sm">
                                                                                {employee?.name?.charAt(0) || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {employee?.name || 'N/A'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {employee?.empCode || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatIstDate(record.stepIn)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(shiftLabel)}`}>
                                                                    {shiftLabel || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', {
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                    hour12: true,
                                                                    timeZone: 'Asia/Kolkata'
                                                                }) : 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', {
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                    hour12: true,
                                                                    timeZone: 'Asia/Kolkata'
                                                                }) : 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                                                    {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs" title={record.address || 'N/A'}>
                                                                <div className="whitespace-pre-line">
                                                                    {record.address || 'N/A'}
                                                                </div>
                                                            </td>
                                                            {!isReadOnlyAdmin && (
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                                        {getSelectedLocation(record.address)}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {!isReadOnlyAdmin && (
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex space-x-2">
                                                                        <button
                                                                            onClick={() => handleEditAttendance(record)}
                                                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteAttendance(record)}
                                                                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                            </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4 p-4">
                                    {filteredData.map((record, index) => {
                                        const employee = record.employeeId;
                                        const getStatusColor = (status) => {
                                            switch (status) {
                                                case 'present': return 'bg-green-100 text-green-800';
                                                case 'absent': return 'bg-red-100 text-red-800';
                                                case 'late': return 'bg-orange-100 text-orange-800';
                                                case 'half-day': return 'bg-blue-100 text-blue-800';
                                                default: return 'bg-gray-100 text-gray-800';
                                            }
                                        };
                                        const shiftLabel = shortShiftName(record.shift);
                                        const getShiftColor = (label) => {
                                            switch (label) {
                                                case 'Morning': return 'bg-blue-100 text-blue-800';
                                                case 'Evening': return 'bg-orange-100 text-orange-800';
                                                case 'Night': return 'bg-purple-100 text-purple-800';
                                                default: return 'bg-gray-100 text-gray-800';
                                            }
                                        };

                                        return (
                                            <div key={record._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                                {/* Employee Info Header */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        <div className="relative flex-shrink-0">
                                                            {employee?.photo ? (
                                                                <img
                                                                    src={employee.photo.startsWith('data:')
                                                                        ? employee.photo
                                                                        : employee.photo.startsWith('http')
                                                                            ? employee.photo
                                                                            : `${getApiUrl().replace('/api', '')}/static/${employee.photo}`
                                                                    }
                                                                    alt={employee?.name || 'Employee'}
                                                                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextElementSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={`h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center ${employee?.photo ? 'hidden' : 'flex'
                                                                    }`}
                                                            >
                                                                <span className="text-blue-600 font-semibold text-lg">
                                                                    {employee?.name?.charAt(0) || 'N/A'}
                                                                </span>
                                                            </div>
                                                            {/* Status indicator */}
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                                {employee?.name || 'N/A'}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 truncate">
                                                                {employee?.email || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 ml-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(record.status)}`}>
                                                            {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Date and Shift */}
                                                <div className="flex items-center space-x-4 mb-3">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-600">
                                                            {formatIstDate(record.stepIn)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(shiftLabel)}`}>
                                                            {shiftLabel || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Timings */}
                                                <div className="flex items-center space-x-4 mb-3">
                                                    <div className="text-sm">
                                                        <span className="text-gray-600">In: </span>
                                                        <span className="font-medium text-gray-900">
                                                            {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true,
                                                                timeZone: 'Asia/Kolkata'
                                                            }) : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-gray-600">Out: </span>
                                                        <span className="font-medium text-gray-900">
                                                            {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true,
                                                                timeZone: 'Asia/Kolkata'
                                                            }) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Location */}
                                                <div className="flex items-start space-x-2 mb-3">
                                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-gray-600 flex-1 whitespace-pre-line">
                                                        {record.address || 'N/A'}
                                                    </div>
                                                </div>

                                                {!isReadOnlyAdmin && (
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <span className="text-sm text-gray-600">Site:</span>
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                            {getSelectedLocation(record.address)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Remarks */}
                                                {record.note && (
                                                    <div className="flex items-start space-x-2 mb-3">
                                                        <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm text-gray-600 flex-1">
                                                            Remarks: {record.note}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Actions - Hidden for readonly users */}
                                                {!isReadOnlyAdmin && (
                                                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                                                        <button
                                                            onClick={() => handleEditAttendance(record)}
                                                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAttendance(record)}
                                                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination Controls */}
                                <Pagination
                                    pagination={pagination}
                                    onPageChange={fetchAttendanceData}
                                    loading={loading}
                                    className="px-6 py-4 border-t border-gray-200"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

            {/* Edit Attendance Modal - Hidden for readonly users */}
            {!isReadOnlyAdmin && editModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto h-[98vh] sm:h-[95vh] md:h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">Edit Attendance Record</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                                        Employee: {selectedAttendance?.employeeId?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2 p-1"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                                {/* Employee Information */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
                                        <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                                        <span>Employee Information</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <Input
                                                value={selectedAttendance?.employeeId?.name || 'N/A'}
                                                disabled
                                                className="bg-gray-50 text-base sm:text-sm py-2.5 sm:py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <Input
                                                value={selectedAttendance?.employeeId?.email || 'N/A'}
                                                disabled
                                                className="bg-gray-50 text-base sm:text-sm py-2.5 sm:py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                                            <Input
                                                value={selectedAttendance?.managerId?.name || 'N/A'}
                                                disabled
                                                className="bg-gray-50 text-base sm:text-sm py-2.5 sm:py-2"
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
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
                                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                        <span>Attendance Details</span>
                                    </h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Step In Time *
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="datetime-local"
                                                    value={editForm.stepIn}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, stepIn: e.target.value }))}
                                                    className="pr-10 text-base sm:text-sm py-2.5 sm:py-2"
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
                                                    className="pr-10 text-base sm:text-sm py-2.5 sm:py-2"
                                                />
                                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Leave empty if employee hasn't clocked out</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Shift *
                                                </label>
                                                <select
                                                    value={editForm.shift}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value }))}
                                                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
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
                                                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
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
                                                className="text-base sm:text-sm py-2.5 sm:py-2"
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
                                                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base sm:text-sm"
                                                placeholder="Enter any additional notes"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Add bottom padding to ensure content is fully visible */}
                            <div className="h-4 sm:h-6"></div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveAttendance}
                                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 sm:py-2 text-sm sm:text-base font-medium"
                            >
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
