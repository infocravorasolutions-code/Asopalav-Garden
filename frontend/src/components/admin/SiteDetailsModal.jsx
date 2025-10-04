import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Users,
  UserPlus,
  UserMinus,
  Map,
  Building,
  Calendar,
  Phone,
  Mail,
  Trash2,
  Loader2,
  Search,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

const SiteDetailsModal = ({ site, onClose, onRefresh }) => {
  const [siteDetails, setSiteDetails] = useState(site);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // Fetch detailed site information
  const fetchSiteDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sites/${site._id}`);
      if (response.data.success) {
        setSiteDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching site details:', error);
      toast.error('Failed to fetch site details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available employees
  const fetchAvailableEmployees = async () => {
    try {
      const response = await api.get('/sites/available-employees');
      if (response.data.success) {
        setAvailableEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available employees:', error);
      toast.error('Failed to fetch available employees');
    }
  };

  // Handle assign employee
  const handleAssignEmployee = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      setAssigning(true);
      const response = await api.post(`/sites/${site._id}/assign`, {
        employeeId: selectedEmployee._id
      });

      if (response.data.success) {
        toast.success('Employee assigned successfully');
        setShowAssignModal(false);
        setSelectedEmployee(null);
        setSearchTerm('');
        await fetchSiteDetails();
        onRefresh();
      }
    } catch (error) {
      console.error('Error assigning employee:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign employee';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  // Handle unassign employee
  const handleUnassignEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to unassign this employee from the site?')) {
      return;
    }

    try {
      const response = await api.post(`/sites/${site._id}/unassign`, {
        employeeId
      });

      if (response.data.success) {
        toast.success('Employee unassigned successfully');
        await fetchSiteDetails();
        onRefresh();
      }
    } catch (error) {
      console.error('Error unassigning employee:', error);
      toast.error('Failed to unassign employee');
    }
  };

  // Handle assign modal open
  const handleAssignModalOpen = () => {
    setShowAssignModal(true);
    fetchAvailableEmployees();
  };

  // Filter employees based on search
  const filteredEmployees = availableEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get site type icon and color
  const getSiteTypeIcon = (type) => {
    switch (type) {
      case 'garden': return '🌱';
      case 'park': return '🌳';
      case 'construction': return '🏗️';
      case 'maintenance': return '🔧';
      default: return '📍';
    }
  };

  const getSiteTypeColor = (type) => {
    switch (type) {
      case 'garden': return 'bg-green-100 text-green-800';
      case 'park': return 'bg-blue-100 text-blue-800';
      case 'construction': return 'bg-orange-100 text-orange-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchSiteDetails();
  }, [site._id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-2 z-50 overflow-y-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl min-h-full sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl sm:text-3xl flex-shrink-0">{getSiteTypeIcon(siteDetails.siteType)}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{siteDetails.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600 font-mono truncate">{siteDetails.siteCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading site details...</span>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
            {/* Site Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Site Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{siteDetails.address}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSiteTypeColor(siteDetails.siteType)} w-fit`}>
                      {siteDetails.siteType.charAt(0).toUpperCase() + siteDetails.siteType.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Radius: {siteDetails.radius}m
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{siteDetails.points?.length || 0} points configured</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Map className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {siteDetails.coordinates.latitude.toFixed(6)}, {siteDetails.coordinates.longitude.toFixed(6)}
                    </span>
                  </div>

                  {siteDetails.description && (
                    <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {siteDetails.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Assigned Employees */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Assigned Employees</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleAssignModalOpen}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Assign Employee</span>
                      <span className="sm:hidden">Assign</span>
                    </Button>
                  </div>
                </div>

                {siteDetails.assignedEmployees?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {siteDetails.assignedEmployees.map((assignment) => (
                      <div
                        key={assignment._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{assignment.employeeName}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {assignment.employeeCode} • {assignment.designation}
                            </p>
                            <p className="text-xs text-gray-500">
                              Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignEmployee(assignment.employeeId)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0 ml-2 p-2"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No employees assigned to this site</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAssignModalOpen}
                      className="mt-2 w-full sm:w-auto"
                    >
                      Assign First Employee
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Site Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base font-medium text-blue-900">Assigned Employees</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">
                  {siteDetails.assignedEmployees?.length || 0}
                </p>
              </div>

              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-sm sm:text-base font-medium text-green-900">Site Radius</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">
                  {siteDetails.radius}m
                </p>
              </div>

              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span className="text-sm sm:text-base font-medium text-purple-900">Site Type</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-purple-900 mt-1 capitalize">
                  {siteDetails.siteType}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assign Employee Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-2 z-60 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md min-h-full sm:min-h-0 sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-base sm:text-lg font-semibold truncate">Assign Employee</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 pb-20 sm:pb-4">
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div
                        key={employee._id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEmployee?._id === employee._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {employee.empCode} • {employee.designation}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No employees found</p>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-white border-t pt-4 -mx-4 px-4">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-end sm:space-y-0 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignModal(false)}
                      disabled={assigning}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignEmployee}
                      disabled={!selectedEmployee || assigning}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span className="hidden sm:inline">Assign Employee</span>
                      <span className="sm:hidden">Assign</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteDetailsModal;
