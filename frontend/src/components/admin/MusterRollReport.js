import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Search, RefreshCw } from 'lucide-react';
import { useEmployee } from '../../contexts/EmployeeContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import toast from 'react-hot-toast';

const MusterRollReport = () => {
  const { employees, fetchEmployees } = useEmployee();
  const { attendanceList, fetchAttendance } = useAttendance();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [fetchEmployees, fetchAttendance]);

  // Get days in selected month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get attendance status for a specific employee and date
  const getAttendanceStatus = (employeeId, day) => {
    const date = new Date(selectedYear, selectedMonth, day);
    const dateString = date.toDateString();
    
    // Handle different attendance list structures
    let attendanceArray = [];
    if (Array.isArray(attendanceList)) {
      attendanceArray = attendanceList;
    } else if (attendanceList && attendanceList.data && Array.isArray(attendanceList.data)) {
      attendanceArray = attendanceList.data;
    } else if (attendanceList && attendanceList.attendance && Array.isArray(attendanceList.attendance)) {
      attendanceArray = attendanceList.attendance;
    }

    const dayAttendance = attendanceArray.find(a => {
      const isCurrentEmployee = a.employeeId?._id === employeeId || a.employeeId === employeeId;
      const isSameDate = new Date(a.stepIn).toDateString() === dateString;
      return isCurrentEmployee && isSameDate;
    });

    if (!dayAttendance) {
      return { status: '', text: '', color: 'gray' };
    }

    switch (dayAttendance.status) {
      case 'present':
        return { status: 'P', text: 'Present', color: 'green' };
      case 'absent':
        return { status: 'A', text: 'Absent', color: 'red' };
      case 'weekoff':
        return { status: 'W', text: 'Week Off', color: 'blue' };
      default:
        return { status: '', text: '', color: 'gray' };
    }
  };

  // Calculate total days for an employee
  const getTotalDays = (employeeId) => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    let presentDays = 0;
    let absentDays = 0;
    let weekoffDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const status = getAttendanceStatus(employeeId, day);
      switch (status.status) {
        case 'P':
          presentDays++;
          break;
        case 'A':
          absentDays++;
          break;
        case 'W':
          weekoffDays++;
          break;
      }
    }

    return { presentDays, absentDays, weekoffDays, totalDays: presentDays + absentDays + weekoffDays };
  };

  // Filter employees
  const filteredEmployees = Array.isArray(employees) ? employees.filter(employee => {
    return searchTerm === '' || 
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.empCode?.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  // Generate date headers
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const dateHeaders = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dateHeaders.push(day);
  }

  // Export to Excel/CSV
  const exportReport = () => {
    // Implementation for export functionality
    toast.success('Export functionality will be implemented soon!');
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await fetchEmployees();
      await fetchAttendance();
      toast.success('Data refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Muster Roll Report</h1>
          <p className="text-secondary-600">Form XVI 1 [See Rule 78(1) (a) (1)] Muster Roll</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="btn btn-primary btn-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search employees by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select select-bordered"
            >
              <option value={0}>January</option>
              <option value={1}>February</option>
              <option value={2}>March</option>
              <option value={3}>April</option>
              <option value={4}>May</option>
              <option value={5}>June</option>
              <option value={6}>July</option>
              <option value={7}>August</option>
              <option value={8}>September</option>
              <option value={9}>October</option>
              <option value={10}>November</option>
              <option value={11}>December</option>
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select select-bordered"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Muster Roll Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="sticky left-0 bg-base-100 z-10">SR NO</th>
                <th className="sticky left-12 bg-base-100 z-10">EMP CODE</th>
                <th className="sticky left-32 bg-base-100 z-10 min-w-48">NAME OF EMPLOYEE</th>
                <th className="min-w-32">DESIGNATION</th>
                <th className="min-w-32">SHIFT</th>
                <th className="min-w-32">UAN</th>
                <th className="min-w-32">ESIC</th>
                {/* Date columns */}
                {dateHeaders.map(day => (
                  <th key={day} className="text-center min-w-8 text-xs">
                    {day}
                  </th>
                ))}
                <th className="min-w-24">TOTAL DAYS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee, index) => {
                const totalDays = getTotalDays(employee._id);
                return (
                  <tr key={employee._id}>
                    <td className="sticky left-0 bg-base-100 z-10 font-medium">
                      {index + 1}
                    </td>
                    <td className="sticky left-12 bg-base-100 z-10 font-mono text-sm">
                      {employee.empCode || 'N/A'}
                    </td>
                    <td className="sticky left-32 bg-base-100 z-10 font-medium">
                      {employee.name}
                    </td>
                    <td className="capitalize">{employee.designation || 'N/A'}</td>
                    <td className="capitalize">{employee.shift || 'N/A'}</td>
                    <td className="font-mono text-sm">{employee.uan || 'N/A'}</td>
                    <td className="font-mono text-sm">{employee.esic || 'N/A'}</td>
                    {/* Date status columns */}
                    {dateHeaders.map(day => {
                      const status = getAttendanceStatus(employee._id, day);
                      return (
                        <td key={day} className="text-center">
                          <span className={`text-xs font-bold ${
                            status.status === 'P' ? 'text-green-600' :
                            status.status === 'A' ? 'text-red-600' :
                            status.status === 'W' ? 'text-blue-600' :
                            'text-gray-400'
                          }`}>
                            {status.status}
                          </span>
                        </td>
                      );
                    })}
                    <td className="font-bold text-center">
                      {totalDays.totalDays}
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Row */}
              <tr className="bg-gray-100 font-bold">
                <td className="sticky left-0 bg-gray-100 z-10 text-center" colSpan="7">
                  TOTAL EMPLOYEES
                </td>
                {dateHeaders.map(day => {
                  // Calculate total present (P) for this day across all employees
                  const totalPresentForDay = employees.reduce((sum, employee) => {
                    const status = getAttendanceStatus(employee._id, day);
                    return sum + (status === 'P' ? 1 : 0);
                  }, 0);
                  
                  return (
                    <td key={day} className="text-center font-bold text-green-600">
                      {totalPresentForDay}
                    </td>
                  );
                })}
                <td className="text-center font-bold text-blue-600">
                  {employees.reduce((sum, employee) => {
                    const totalDays = dateHeaders.reduce((daySum, day) => {
                      const status = getAttendanceStatus(employee._id, day);
                      return daySum + (status === 'P' ? 1 : 0);
                    }, 0);
                    return sum + totalDays;
                  }, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-100 text-green-600 font-bold text-center rounded">P</span>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-100 text-red-600 font-bold text-center rounded">A</span>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-100 text-blue-600 font-bold text-center rounded">W</span>
            <span>Week Off</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-100 text-gray-400 font-bold text-center rounded">-</span>
            <span>No Record</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {filteredEmployees.reduce((total, emp) => total + getTotalDays(emp._id).presentDays, 0)}
          </div>
          <div className="text-sm text-secondary-600">Total Present Days</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {filteredEmployees.reduce((total, emp) => total + getTotalDays(emp._id).absentDays, 0)}
          </div>
          <div className="text-sm text-secondary-600">Total Absent Days</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {filteredEmployees.reduce((total, emp) => total + getTotalDays(emp._id).weekoffDays, 0)}
          </div>
          <div className="text-sm text-secondary-600">Total Week Off Days</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-secondary-900">
            {filteredEmployees.length}
          </div>
          <div className="text-sm text-secondary-600">Total Employees</div>
        </div>
      </div>
    </div>
  );
};

export default MusterRollReport;
