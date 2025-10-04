import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, Filter, Search, FileText, X } from 'lucide-react';
import { adminAPI, api } from '../../services/api';
import toast, { showSuccess, showError } from '../../utils/toast';

const TraditionalMusterRollReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    shift: '',
    status: ''
  });
  const companyinfo = JSON.parse(localStorage.getItem('company'));
  // const [companyInfo] = useState({
  //   name: 'PANTHER SECURE',
  //   location: 'RIVERFRONT AHMEDABAD UNIT',
  //   month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  // });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch employees first
      const employeesResponse = await api.get('/employee/all');
      const employees = employeesResponse.data.data;

      // Fetch attendance data for the current month
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const attendanceResponse = await adminAPI.getAttendance()
      const allAttendanceData = attendanceResponse.attendance || [];

      // Filter attendance data by date range
      const attendanceData = allAttendanceData.filter(att => {
        const attDate = new Date(att.stepIn);
        return attDate >= startDate && attDate <= endDate;
      });

      // Process data to create muster roll format
      const processedData = employees.map((employee, index) => {
        const employeeAttendance = attendanceData.filter(att => {
          // Handle both populated and non-populated employeeId
          const attEmployeeId = att.employeeId._id || att.employeeId;
          return attEmployeeId.toString() === employee._id.toString();
        });

        // Create attendance object for each day of the month
        const attendance = {};
        const daysInMonth = endDate.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const dayAttendance = employeeAttendance.find(att => {
            const attDate = new Date(att.stepIn);
            return attDate.getDate() === day &&
              attDate.getMonth() === currentDate.getMonth() &&
              attDate.getFullYear() === currentDate.getFullYear();
          });

          attendance[day] = dayAttendance ? 'P' : '';
        }

        // Calculate total present days
        const totalDays = Object.values(attendance).filter(day => day === 'P').length;

        return {
          srNo: index + 1,
          empCode: employee.empCode || employee.employeeId || `EMP${employee._id.slice(-6)}`,
          name: employee.name,
          designation: employee.designation || employee.position || 'employee',
          shift: employee.shift || 'Morning',
          attendance,
          totalDays
        };
      });

      setReportData(processedData);
      console.log("processedData ==> ", processedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      showError('Failed to fetch report data');

    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      shift: '',
      status: ''
    });
    // Don't clear the report data - just reset filters
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      debugger
      // Fetch employees
      const employeesResponse = await api.get('/employee/all');
      let employees = employeesResponse.data.data;

      console.log('All employees before filtering:', employees.length);
      console.log('Applied filters:', filters);

      // Apply shift filter
      if (filters.shift && filters.shift !== '') {
        employees = employees.filter(emp => {
          if (!emp.shift) return false;
          const empShift = emp.shift.toLowerCase();
          const filterShift = filters.shift.toLowerCase();

          // Flexible shift matching
          if (filterShift === 'morning') {
            return empShift.includes('morning') || empShift.includes('7:00') || empShift.includes('am');
          } else if (filterShift === 'evening') {
            return empShift.includes('evening') || empShift.includes('3:00') || empShift.includes('pm');
          } else if (filterShift === 'night') {
            return empShift.includes('night') || empShift.includes('11:00');
          } else {
            return empShift.includes(filterShift);
          }
        });
        console.log(`After shift filter (${filters.shift}):`, employees.length);
      }


      // Fetch attendance data with date filters
      const startDate = filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = filters.endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const attendanceResponse = await adminAPI.getAttendance()
      const allAttendanceData = attendanceResponse.attendance || [];

      // Filter attendance data by date range, status, and filtered employees
      const filteredEmployeeIds = employees.map(emp => emp._id);
      const attendanceData = allAttendanceData.filter(att => {
        const attDate = new Date(att.stepIn);
        const dateMatch = attDate >= new Date(startDate) && attDate <= new Date(endDate);
        const statusMatch = !filters.status || att.status === filters.status;
        const employeeMatch = filteredEmployeeIds.includes(att.employeeId._id || att.employeeId);
        return dateMatch && statusMatch && employeeMatch;
      });

      console.log(`Filtered employees: ${employees.length}`);
      console.log(`Filtered attendance records: ${attendanceData.length}`);

      // Process data to create muster roll format
      const processedData = employees.map((employee, index) => {
        const employeeAttendance = attendanceData.filter(att => {
          // Handle both populated and non-populated employeeId
          const attEmployeeId = att.employeeId._id || att.employeeId;
          return attEmployeeId.toString() === employee._id.toString();
        });

        // Create attendance object for each day of the selected period
        const attendance = {};
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        for (let day = 1; day <= daysInPeriod; day++) {
          const dayDate = new Date(start);
          dayDate.setDate(start.getDate() + day - 1);

          const dayAttendance = employeeAttendance.find(att => {
            const attDate = new Date(att.stepIn);
            return attDate.toDateString() === dayDate.toDateString();
          });

          attendance[day] = dayAttendance ? 'P' : '';
        }

        // Calculate total present days
        const totalDays = Object.values(attendance).filter(day => day === 'P').length;

        return {
          srNo: index + 1,
          empCode: employee.empCode || employee.employeeId || `EMP${employee._id.slice(-6)}`,
          name: employee.name,
          designation: employee.designation || employee.position || 'employee',
          shift: employee.shift || 'Morning',
          attendance,
          totalDays
        };
      });

      setReportData(processedData);
      showSuccess('Report generated successfully');
    } catch (error) {
      showError('Failed to generate report');
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Create CSV content from current report data
      const csvContent = generateCSVContent();

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `muster-roll-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess('Report exported to CSV successfully');
    } catch (error) {
      showError('Failed to export report to CSV');
      console.error('Error exporting to CSV:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);

      if (!reportData || reportData.length === 0) {
        toast.error('No muster roll data to export');
        return;
      }

      // Create dateRange from filters
      const dateRange = {
        startDate: filters.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: filters.endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
      };

      // Import the enhanced PDF export utility
      let exportTraditionalMusterRollToPDF;
      try {
        const pdfUtils = await import('../../utils/pdfExportUtils');
        exportTraditionalMusterRollToPDF = pdfUtils.exportTraditionalMusterRollToPDF || pdfUtils.default?.exportTraditionalMusterRollToPDF;

        if (!exportTraditionalMusterRollToPDF) {
          throw new Error('PDF export function not found');
        }
      } catch (error) {
        console.error('Error importing PDF utils:', error);
        toast.error('Failed to load PDF export utility. Please try again.');
        return;
      }

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `asopalav_garden_muster_roll_${timestamp}.pdf`;

      // Get company code from company info
      const companyCode = companyinfo?.code || companyinfo?.companyCode || 'ASOPALAV';
      const fallbackLogoUrl = companyinfo?.logoUrl || null;

      // Use the enhanced PDF export function with company branding
      await exportTraditionalMusterRollToPDF(reportData, dateRange, filename, {
        companyCode,
        fallbackLogoUrl
      });

      // Show success message
      const isWebView = window.ReactNativeWebView !== undefined;
      if (isWebView) {
        toast.showSuccess(`${companyinfo?.name || 'Company'} muster roll PDF export initiated in mobile app`);
      } else {
        toast.showSuccess(`${companyinfo?.name || 'Company'} muster roll PDF exported successfully`);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showError(`Failed to export report to PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateCSVContent = () => {
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = Math.min(daysInPeriod, 31);

    const headers = [
      'SR NO', 'EMP CODE', 'NAME OF EMPLOYEE', 'DESIGNATION', 'SHIFT',
      ...Array.from({ length: maxDays }, (_, i) => `Day ${i + 1}`),
      'TOTAL DAYS'
    ];

    const rows = reportData.map(employee => {
      const row = [
        employee.srNo,
        employee.empCode,
        employee.name,
        employee.designation,
        employee.shift,
        ...Array.from({ length: maxDays }, (_, i) => employee.attendance[i + 1] || ''),
        employee.totalDays
      ];
      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const renderDayColumns = () => {
    const days = [];
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 1; i <= Math.min(daysInPeriod, 31); i++) {
      days.push(
        <th key={i} className="border border-gray-300 bg-gray-100 px-1 py-2 text-center text-xs font-bold w-8">
          {i}
        </th>
      );
    }
    return days;
  };

  const renderAttendanceCell = (day, attendance) => {
    const isPresent = attendance[day] === 'P';
    return (
      <td key={day} className="border border-gray-300 px-1 py-1 text-center text-xs w-8">
        {isPresent && (
          <span className="inline-flex w-4 h-4 bg-green-500 text-white rounded-full text-xs font-bold items-center justify-center">
            P
          </span>
        )}
      </td>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Traditional Muster Roll Report Preview</h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select
                name="shift"
                value={filters.shift}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Shifts</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Filter className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Filter Status */}
        {(filters.startDate || filters.endDate || filters.shift || filters.status) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Active Filters:</h3>
            <div className="flex flex-wrap gap-2">
              {filters.startDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Start: {new Date(filters.startDate).toLocaleDateString()}
                </span>
              )}
              {filters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  End: {new Date(filters.endDate).toLocaleDateString()}
                </span>
              )}
              {filters.shift && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Shift: {filters.shift}
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Status: {filters.status}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Report Header */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Form XVI 1 [See Rule 78(1) (a) (1)] Muster Roll
            </h2>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{companyinfo.name}</h3>
            <p className="text-sm text-gray-600">
              DEPLOYMENT OF SECURITY PERSON AT {companyinfo.location} ON {companyinfo.month}
            </p>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-center text-xs font-bold w-16">SR NO</th>
                <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-center text-xs font-bold w-24">EMP CODE</th>
                <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-center text-xs font-bold w-32">NAME OF EMPLOYEE</th>
                <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-center text-xs font-bold w-28">DESIGNATION</th>
                <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-center text-xs font-bold w-40">SHIFT</th>
                {renderDayColumns()}
                <th className="border border-gray-300 bg-gray-100 px-2 py-2 text-center text-xs font-bold w-20">TOTAL DAYS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7 + Math.min(31, (filters.startDate && filters.endDate ?
                    Math.ceil((new Date(filters.endDate) - new Date(filters.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 30)) + 1}
                    className="border border-gray-300 px-4 py-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading report data...</span>
                    </div>
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={7 + Math.min(31, (filters.startDate && filters.endDate ?
                    Math.ceil((new Date(filters.endDate) - new Date(filters.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 30)) + 1}
                    className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No data available for the selected criteria
                  </td>
                </tr>
              ) : (
                reportData.map((employee) => {
                  const startDate = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                  const endDate = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
                  const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <tr key={employee.srNo} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-2 text-center text-xs w-16">{employee.srNo}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-xs font-mono w-24">{employee.empCode}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs w-32">{employee.name}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-xs w-28">{employee.designation}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-xs w-40">{employee.shift}</td>
                      {Array.from({ length: Math.min(daysInPeriod, 31) }, (_, i) => i + 1).map(day =>
                        renderAttendanceCell(day, employee.attendance)
                      )}
                      <td className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-blue-600 w-20">
                        {employee.totalDays}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TraditionalMusterRollReport;