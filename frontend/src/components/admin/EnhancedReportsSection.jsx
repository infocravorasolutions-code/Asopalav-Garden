import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  Calendar,
  Users,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Printer,
  FileSpreadsheet,
  Shield
} from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useEmployee } from '../../contexts/EmployeeContext';
import { useManager } from '../../contexts/ManagerContext';
import { useAuth } from '../../contexts/AuthContext';
import { exportTraditionalMusterRollToPDF } from '../../utils/pdfExportUtils';
import toast from 'react-hot-toast';

const EnhancedReportsSection = () => {
  const { user } = useAuth();
  
  // Check if user is readonly admin
  const isReadOnlyAdmin = user?.role === 'readonly';
  
  const {
    attendanceList,
    managers,
    employees,
    fetchAttendance,
    fetchManagers,
    fetchEmployees,
    exportToCSV,
    exportToPDF,
    isLoading
  } = useAttendance();

  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    managerId: '',
    shift: '',
    category: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Function to reset to current month
  const resetToCurrentMonth = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: lastDayOfMonth.toISOString().split('T')[0]
    });
    
    // Generate report after a short delay
    setTimeout(() => {
      generateAttendanceReport();
    }, 100);
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAttendance(),
          fetchManagers(),
          fetchEmployees()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, [fetchAttendance, fetchManagers, fetchEmployees]);

  // Set default date range to current month - only run once on mount
  useEffect(() => {
    // Set default date range to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: lastDayOfMonth.toISOString().split('T')[0]
    });
  }, []); // Only run once on mount

  // Auto-generate report when data is loaded or filters change
  useEffect(() => {
    if (attendanceList.length > 0 && dateRange.startDate && dateRange.endDate) {
      // Auto-generating report due to filter change
      setTimeout(() => {
        generateAttendanceReport();
      }, 100);
    }
  }, [attendanceList.length, dateRange.startDate, dateRange.endDate, filters.shift]);

  // Generate attendance report data
  const generateAttendanceReport = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    console.log('📊 Generating attendance report with current filters');

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    // Filter attendance data by date range and shift
    let filteredAttendance = attendanceList.filter(record => {
      const recordDate = new Date(record.stepIn);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Apply shift filter if specified
    if (filters.shift) {
      filteredAttendance = filteredAttendance.filter(record => {
        const employeeShift = record.employeeId?.shift?.toLowerCase()?.trim();
        const filterShift = filters.shift?.toLowerCase()?.trim();
        return employeeShift === filterShift;
      });
    }

    console.log('📊 Filtered attendance data:', {
      totalRecords: filteredAttendance.length,
      shiftFilter: filters.shift,
      dateRange: { startDate, endDate }
    });
    
    setReportData(filteredAttendance);
    setShowPreview(true);
    toast.success(`Report generated successfully with ${filteredAttendance.length} records`);
  };

  // Export to professional PDF (matching reference image)
  const exportProfessionalPDF = async () => {
    if (reportData.length === 0) {
      toast.error('No report data to export');
      return;
    }

    try {
      const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportToPDF(reportData, filename);
    } catch (err) {
      console.error('Error exporting professional PDF:', err);
      toast.error('Failed to export PDF: ' + err.message);
    }
  };

  // Export to CSV
  const exportCSV = () => {
    if (reportData.length === 0) {
      toast.error('No report data to export');
      return;
    }

    try {
      const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(reportData, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error('Failed to export CSV: ' + err.message);
    }
  };

  // Export traditional muster roll PDF
  const exportMusterRollPDF = async () => {
    if (reportData.length === 0) {
      toast.error('No report data to export');
      return;
    }

    try {
      const filename = `muster_roll_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportTraditionalMusterRollToPDF(reportData, dateRange, filename);
    } catch (err) {
      console.error('Error exporting muster roll PDF:', err);
      toast.error('Failed to export muster roll PDF: ' + err.message);
    }
  };

  const reportTypes = [
    {
      id: 'attendance',
      name: 'Attendance Report',
      description: 'Professional attendance report with company branding',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      id: 'muster-roll',
      name: 'Muster Roll Report',
      description: 'Traditional Form XVI muster roll format',
      icon: Shield,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Enhanced Reports</h1>
          <p className="text-secondary-600">Generate professional reports with company branding</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
        </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`card cursor-pointer transition-all duration-200 ${
              selectedReport === report.id 
                ? 'ring-2 ring-primary-500 bg-primary-50' 
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${report.color}`}>
                <report.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-secondary-900">{report.name}</h3>
                <p className="text-sm text-secondary-600">{report.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Parameters */}
      {selectedReport && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-secondary-900">Report Parameters</h3>
            <div className="text-sm text-secondary-600">
              Current Month: <span className="font-semibold text-primary-600">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="input"
              />
              {dateRange.startDate && (
                <div className="text-xs text-secondary-500 mt-1">
                  Selected: {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="input"
              />
              {dateRange.endDate && (
                <div className="text-xs text-secondary-500 mt-1">
                  Selected: {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
            <div>
              <label className="label">Shift</label>
              <select
                className="input"
                value={filters.shift}
                onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
              >
                <option value="">All Shifts</option>
                <option value="morning">Morning Shift</option>
                <option value="evening">Evening Shift</option>
                <option value="night">Night Shift</option>
              </select>
              {filters.shift && (
                <div className="text-xs text-secondary-500 mt-1">
                  Filtering by: {filters.shift.charAt(0).toUpperCase() + filters.shift.slice(1)} Shift
                </div>
              )}
            </div>
            
            {/* Clear Shift Filter Button */}
            {filters.shift && (
              <div className="flex items-start pt-6">
                <button
                  onClick={() => setFilters({ ...filters, shift: '' })}
                  className="btn btn-outline btn-sm"
                  title="Clear shift filter"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filter
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-3">
              {/* Additional controls can go here */}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetToCurrentMonth}
                className="btn btn-warning"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reset to Current Month
              </button>
              <button
                onClick={generateAttendanceReport}
                className="btn btn-primary"
                disabled={!dateRange.startDate || !dateRange.endDate || isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      {showPreview && reportData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Export Report</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportProfessionalPDF}
              className="btn btn-primary flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Professional PDF
            </button>
            <button
              onClick={exportCSV}
              className="btn btn-success flex items-center"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </button>
            {selectedReport === 'muster-roll' && (
              <button
                onClick={exportMusterRollPDF}
                className="btn btn-warning flex items-center"
              >
                <Shield className="h-4 w-4 mr-2" />
                Export Muster Roll PDF
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="btn btn-outline flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </button>
          </div>
        </div>
      )}

      {/* Report Preview */}
      {showPreview && reportData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            {selectedReport === 'attendance' ? 'Professional Attendance Report Preview' : 'Muster Roll Report Preview'}
          </h3>
          
          {/* Header Information */}
          <div className="text-center mb-6 border-b pb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold">NILKANTH LANDSCAPE</h2>
            </div>
            <h3 className="text-base font-semibold text-gray-600">Professional Landscape Solutions</h3>
            <p className="text-sm mt-1 text-gray-500">
              ATTENDANCE REPORT - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
            </p>
          </div>

          {/* Summary Section - Only visible for readonly users */}
          {isReadOnlyAdmin && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-sm mb-3">SUMMARY</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-bold text-lg">
                    {reportData.filter(record => record.stepIn).length}
                  </div>
                  <div className="text-gray-600">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 font-bold text-lg">
                    {reportData.filter(record => !record.stepIn).length}
                  </div>
                  <div className="text-gray-600">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 font-bold text-lg">
                    {Math.floor(reportData.reduce((sum, record) => sum + (record.totalTime || 0), 0) / 60)}h {reportData.reduce((sum, record) => sum + (record.totalTime || 0), 0) % 60}m
                  </div>
                  <div className="text-gray-600">Total Hours</div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table - Hidden for readonly users */}
          {!isReadOnlyAdmin && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold">Date</th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold">Employee Name</th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold">Shift</th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold">Clock In</th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold">Clock Out</th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold">Location</th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 10).map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-400 px-2 py-2 text-center">
                          {new Date(record.stepIn).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 font-medium">
                          {record.employeeId?.name || 'N/A'}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center capitalize">
                          {record.shift || 'N/A'}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center">
                          {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center">
                          {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-sm">
                          {record.address || 'N/A'}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-sm">
                          {record.note || 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {reportData.length > 10 && (
                      <tr>
                        <td colSpan="7" className="border border-gray-400 px-2 py-2 text-center text-gray-500">
                          ... and {reportData.length - 10} more records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 text-center">
                  This report was generated automatically by Nilkanth Landscape System. 
                  For any queries, please contact the system administrator.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* No Data Message */}
      {showPreview && reportData.length === 0 && (
        <div className="card">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No report data available. Please generate a report first.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default EnhancedReportsSection;
