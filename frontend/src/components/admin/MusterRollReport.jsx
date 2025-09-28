import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Filter,
    Download,
    FileText,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    UserCheck
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import { adminAPI, api } from '../../services/api';
import toast from 'react-hot-toast';

const MusterRollReport = () => {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        shift: '',
        status: '',
        employeeId: ''
    });
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [employees, setEmployees] = useState([]);

    // Fetch employees for filter dropdown
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await adminAPI.getEmployees();
                setEmployees(response.data || []);
            } catch (error) {
                console.error('Error fetching employees:', error);
            }
        };
        fetchEmployees();
    }, []);

    // Generate report
    const generateReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await adminAPI.getMusterRollReport(params.toString());
            setReportData(response.data || []);
            setSummary(response.summary || {});
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating report: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Export to Excel
    const exportToExcel = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/api/employee/muster-roll/export/excel?${params.toString()}`, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `MusterRoll_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('Muster roll report exported to Excel successfully!');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export muster roll report to Excel');
        } finally {
            setExporting(false);
        }
    };

    // Export to PDF
    const exportToPDF = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/api/employee/muster-roll/export/pdf?${params.toString()}`, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `MusterRoll_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('Muster roll report exported to PDF successfully!');
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Failed to export muster roll report to PDF');
        } finally {
            setExporting(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'absent':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'late':
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'half-day':
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return <UserCheck className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800';
            case 'absent':
                return 'bg-red-100 text-red-800';
            case 'late':
                return 'bg-orange-100 text-orange-800';
            case 'half-day':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Muster Roll Report</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                        Generate and export traditional muster roll reports with filtering options
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <Button
                        onClick={exportToExcel}
                        disabled={exporting || reportData.length === 0}
                        className="flex items-center space-x-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export Excel</span>
                    </Button>
                    <Button
                        onClick={exportToPDF}
                        disabled={exporting || reportData.length === 0}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Export PDF</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="h-5 w-5 mr-2" />
                        Report Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Shift
                            </label>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Employee
                            </label>
                            <select
                                value={filters.employeeId}
                                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Employees</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.name} ({emp.empCode})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button
                            onClick={generateReport}
                            disabled={loading}
                            className="flex items-center space-x-2"
                        >
                            <Calendar className="h-4 w-4" />
                            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {Object.keys(summary).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <Users className="h-8 w-8 text-blue-500" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.totalEmployees}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-600">Present</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.presentCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <XCircle className="h-8 w-8 text-red-500" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-600">Absent</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.absentCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <AlertCircle className="h-8 w-8 text-orange-500" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-600">Late</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.lateCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Report Data */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loading />
                </div>
            ) : reportData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Muster Roll Report</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                            Step In
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Step Out
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Hours
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shift
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.map((empData, empIndex) =>
                                        empData.attendanceRecords.map((record, recordIndex) => (
                                            <tr key={`${empIndex}-${recordIndex}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.employeeId?.name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {record.employeeId?.empCode || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {record.stepIn ? new Date(record.stepIn).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {record.stepIn ? new Date(record.stepIn).toLocaleTimeString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {record.stepOut ? new Date(record.stepOut).toLocaleTimeString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {record.totalTime ? (record.totalTime / 60).toFixed(2) + ' hrs' : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                                        {getStatusIcon(record.status)}
                                                        <span className="ml-1 capitalize">{record.status || 'N/A'}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                                    {record.shift || 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Data</h3>
                        <p className="text-gray-500">
                            Apply filters and click "Generate Report" to view muster roll data.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MusterRollReport;
