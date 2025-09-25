// import React, { useEffect, useState } from 'react';
// import { Clock, Users, Filter, RefreshCw, LogIn, LogOut, Calendar, User } from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';
// import { useManagerAttendance } from '../../contexts/ManagerAttendanceContext';

// const MyAttendance = () => {
//   const { user } = useAuth();
//   const { 
//     attendanceList, 
//     employees, 
//     fetchAttendance, 
//     fetchEmployees, 
//     clockInEmployee, 
//     clockOutEmployee, 
//     loading 
//   } = useManagerAttendance();

//   const [filters, setFilters] = useState({
//     employeeId: '',
//     startDate: '',
//     endDate: '',
//     shift: '',
//     status: ''
//   });

//   useEffect(() => {
//     fetchEmployees();
//     fetchAttendance(filters);
//   }, [fetchEmployees, fetchAttendance]);

//   const handleFilterChange = (key, value) => {
//     const newFilters = { ...filters, [key]: value };
//     setFilters(newFilters);
//     fetchAttendance(newFilters);
//   };

//   const handleClockIn = async (employeeId) => {
//     const result = await clockInEmployee({ employeeId });
//     if (result.success) {
//       fetchAttendance(filters);
//     }
//   };

//   const handleClockOut = async (employeeId) => {
//     const result = await clockOutEmployee({ employeeId });
//     if (result.success) {
//       fetchAttendance(filters);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const formatTime = (timeString) => {
//     return new Date(timeString).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-secondary-900">Team Attendance</h1>
//           <p className="text-secondary-600">Monitor and manage your team's attendance</p>
//         </div>
//         <button
//           onClick={() => fetchAttendance(filters)}
//           className="btn btn-primary btn-sm"
//           disabled={loading}
//         >
//           <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//           Refresh
//         </button>
//       </div>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="card p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-secondary-600">Total Employees</p>
//               <p className="text-2xl font-bold text-secondary-900">
//                 {Array.isArray(employees) ? employees.length : 0}
//               </p>
//             </div>
//             <Users className="h-8 w-8 text-secondary-400" />
//           </div>
//         </div>
//         <div className="card p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-secondary-600">Present Today</p>
//               <p className="text-2xl font-bold text-green-600">
//                 {Array.isArray(attendanceList) ? attendanceList.filter(a => a.status === 'present').length : 0}
//               </p>
//             </div>
//             <LogIn className="h-8 w-8 text-green-500" />
//           </div>
//         </div>
//         <div className="card p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-secondary-600">Absent Today</p>
//               <p className="text-2xl font-bold text-red-600">
//                 {Array.isArray(attendanceList) ? attendanceList.filter(a => a.status === 'absent').length : 0}
//               </p>
//             </div>
//             <LogOut className="h-8 w-8 text-red-500" />
//           </div>
//         </div>
//         <div className="card p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-secondary-600">Late Today</p>
//               <p className="text-2xl font-bold text-yellow-600">
//                 {Array.isArray(attendanceList) ? attendanceList.filter(a => a.status === 'late').length : 0}
//               </p>
//             </div>
//             <Clock className="h-8 w-8 text-yellow-500" />
//           </div>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="card p-4">
//         <div className="flex items-center gap-4 mb-4">
//           <Filter className="h-5 w-5 text-secondary-500" />
//           <h3 className="font-medium text-secondary-900">Filters</h3>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//           <select
//             value={filters.employeeId}
//             onChange={(e) => handleFilterChange('employeeId', e.target.value)}
//             className="input input-bordered input-sm"
//           >
//             <option value="">All Employees</option>
//             {Array.isArray(employees) && employees.map(emp => (
//               <option key={emp._id} value={emp._id}>{emp.name}</option>
//             ))}
//           </select>
//           <input
//             type="date"
//             value={filters.startDate}
//             onChange={(e) => handleFilterChange('startDate', e.target.value)}
//             className="input input-bordered input-sm"
//             placeholder="Start Date"
//           />
//           <input
//             type="date"
//             value={filters.endDate}
//             onChange={(e) => handleFilterChange('endDate', e.target.value)}
//             className="input input-bordered input-sm"
//             placeholder="End Date"
//           />
//           <select
//             value={filters.shift}
//             onChange={(e) => handleFilterChange('shift', e.target.value)}
//             className="input input-bordered input-sm"
//           >
//             <option value="">All Shifts</option>
//             <option value="morning">Morning</option>
//             <option value="evening">Evening</option>
//             <option value="night">Night</option>
//           </select>
//           <select
//             value={filters.status}
//             onChange={(e) => handleFilterChange('status', e.target.value)}
//             className="input input-bordered input-sm"
//           >
//             <option value="">All Status</option>
//             <option value="present">Present</option>
//             <option value="absent">Absent</option>
//             <option value="late">Late</option>
//           </select>
//         </div>
//       </div>

//       {/* Attendance Table */}
//       {loading ? (
//         <div className="flex justify-center items-center py-8">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           <span className="ml-2">Loading attendance...</span>
//         </div>
//       ) : !Array.isArray(attendanceList) || attendanceList.length === 0 ? (
//         <div className="card text-center py-12">
//           <Clock className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-secondary-900 mb-2">No Attendance Records</h3>
//           <p className="text-secondary-600">No attendance records found for the selected filters.</p>
//         </div>
//       ) : (
//         <div className="card overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="table table-zebra w-full">
//               <thead>
//                 <tr>
//                   <th>Employee</th>
//                   <th>Date</th>
//                   <th>Shift</th>
//                   <th>Clock In</th>
//                   <th>Clock Out</th>
//                   <th>Status</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Array.isArray(attendanceList) && attendanceList.map((attendance) => (
//                   <tr key={attendance._id}>
//                     <td>
//                       <div className="flex items-center space-x-3">
//                         <div className="avatar">
//                           <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center">
//                             <User className="h-5 w-5 text-secondary-500" />
//                           </div>
//                         </div>
//                         <div>
//                           <div className="font-medium">{attendance.employeeId?.name || 'Unknown'}</div>
//                           <div className="text-sm text-secondary-500">{attendance.employeeId?.email || 'N/A'}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td>
//                       <div className="flex items-center space-x-2">
//                         <Calendar className="h-4 w-4 text-secondary-400" />
//                         <span className="text-sm">{formatDate(attendance.date)}</span>
//                       </div>
//                     </td>
//                     <td>
//                       <span className={`badge badge-sm ${
//                         attendance.shift === 'morning' ? 'badge-primary' :
//                         attendance.shift === 'evening' ? 'badge-secondary' :
//                         attendance.shift === 'night' ? 'badge-accent' :
//                         'badge-outline'
//                       }`}>
//                         {attendance.shift || 'N/A'}
//                       </span>
//                     </td>
//                     <td>
//                       <span className="text-sm">
//                         {attendance.clockIn ? formatTime(attendance.clockIn) : 'Not clocked in'}
//                       </span>
//                     </td>
//                     <td>
//                       <span className="text-sm">
//                         {attendance.clockOut ? formatTime(attendance.clockOut) : 'Not clocked out'}
//                       </span>
//                     </td>
//                     <td>
//                       <span className={`badge badge-sm ${
//                         attendance.status === 'present' ? 'badge-success' :
//                         attendance.status === 'absent' ? 'badge-error' :
//                         attendance.status === 'late' ? 'badge-warning' :
//                         'badge-outline'
//                       }`}>
//                         {attendance.status || 'Unknown'}
//                       </span>
//                     </td>
//                     <td>
//                       <div className="flex items-center space-x-2">
//                         {!attendance.clockIn && (
//                           <button
//                             onClick={() => handleClockIn(attendance.employeeId?._id)}
//                             className="btn btn-ghost btn-xs"
//                             title="Clock In"
//                           >
//                             <LogIn className="h-4 w-4 text-green-600" />
//                           </button>
//                         )}
//                         {attendance.clockIn && !attendance.clockOut && (
//                           <button
//                             onClick={() => handleClockOut(attendance.employeeId?._id)}
//                             className="btn btn-ghost btn-xs"
//                             title="Clock Out"
//                           >
//                             <LogOut className="h-4 w-4 text-red-600" />
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyAttendance;
