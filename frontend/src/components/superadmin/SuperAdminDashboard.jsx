import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '../../utils/toast';
import EnhancedEditCompanyModal from './EnhancedEditCompanyModal';

const SuperAdminDashboard = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        industry: '',
        description: '',
        timezone: 'Asia/Kolkata',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        accentColor: '#F59E0B',
        backgroundColor: '#F8FAFC',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        logoUrl: '',
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        autoStepOutHours: 8,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        allowEmployeeRegistration: false,
        requireLocationForAttendance: false,
        allowMultipleShifts: true
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`http://localhost:5678/api/superadmin/companies`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setCompanies(data.data);
            } else {
                showError('Failed to fetch companies');
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
            showError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`http://localhost:5678/api/superadmin/companies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('Company created successfully');
                setShowCreateModal(false);
                resetForm();
                fetchCompanies();
            } else {
                showError(data.message || 'Failed to create company');
            }
        } catch (error) {
            console.error('Error creating company:', error);
            showError('Network error');
        }
    };

    const handleEditCompany = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('superadmin_token');

            // Prepare the data with settings object
            const updateData = {
                name: formData.name,
                code: formData.code,
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
                website: formData.website,
                industry: formData.industry,
                description: formData.description,
                timezone: formData.timezone,
                primaryColor: formData.primaryColor,
                secondaryColor: formData.secondaryColor,
                accentColor: formData.accentColor,
                backgroundColor: formData.backgroundColor,
                textColor: formData.textColor,
                fontFamily: formData.fontFamily,
                logoUrl: formData.logoUrl,
                settings: {
                    allowEmployeeRegistration: formData.allowEmployeeRegistration,
                    requireLocationForAttendance: formData.requireLocationForAttendance,
                    allowMultipleShifts: formData.allowMultipleShifts,
                    autoStepOutHours: formData.autoStepOutHours,
                    workingDays: formData.workingDays,
                    workingHours: {
                        start: formData.workingHoursStart,
                        end: formData.workingHoursEnd
                    }
                }
            };

            const response = await fetch(`http://localhost:5678/api/superadmin/companies/${selectedCompany._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('Company updated successfully');
                setShowEditModal(false);
                setSelectedCompany(null);
                resetForm();
                fetchCompanies();
            } else {
                showError(data.message || 'Failed to update company');
            }
        } catch (error) {
            console.error('Error updating company:', error);
            showError('Network error');
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`http://localhost:5678/api/superadmin/companies/${companyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('Company deleted successfully');
                fetchCompanies();
            } else {
                showError(data.message || 'Failed to delete company');
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            showError('Network error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            address: '',
            phone: '',
            email: '',
            website: '',
            industry: '',
            description: '',
            timezone: 'Asia/Kolkata',
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            accentColor: '#F59E0B',
            backgroundColor: '#F8FAFC',
            textColor: '#1F2937',
            fontFamily: 'Inter',
            logoUrl: '',
            workingHoursStart: '09:00',
            workingHoursEnd: '18:00',
            autoStepOutHours: 8,
            workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            allowEmployeeRegistration: false,
            requireLocationForAttendance: false,
            allowMultipleShifts: true
        });
    };

    const openEditModal = (company) => {
        setSelectedCompany(company);
        setFormData({
            name: company.name || '',
            code: company.code || '',
            address: company.address || '',
            phone: company.phone || '',
            email: company.email || '',
            website: company.website || '',
            industry: company.industry || '',
            description: company.description || '',
            timezone: company.timezone || 'Asia/Kolkata',
            primaryColor: company.primaryColor || '#3B82F6',
            secondaryColor: company.secondaryColor || '#1E40AF',
            accentColor: company.accentColor || '#F59E0B',
            backgroundColor: company.backgroundColor || '#F8FAFC',
            textColor: company.textColor || '#1F2937',
            fontFamily: company.fontFamily || 'Inter',
            logoUrl: company.logoUrl || '',
            workingHoursStart: company.settings?.workingHours?.start || '09:00',
            workingHoursEnd: company.settings?.workingHours?.end || '18:00',
            autoStepOutHours: company.settings?.autoStepOutHours || 8,
            workingDays: company.settings?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            allowEmployeeRegistration: company.settings?.allowEmployeeRegistration || false,
            requireLocationForAttendance: company.settings?.requireLocationForAttendance || false,
            allowMultipleShifts: company.settings?.allowMultipleShifts || true
        });
        setShowEditModal(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
        localStorage.removeItem('user_role');
        navigate('/superadmin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading companies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
                            <p className="text-gray-600">Manage all companies and system settings</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Create Company
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                                <p className="text-2xl font-semibold text-gray-900">{companies.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {companies.reduce((total, company) => total + (company.stats?.totalUsers || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Companies</p>
                                <p className="text-2xl font-semibold text-gray-900">{companies.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">System Status</p>
                                <p className="text-2xl font-semibold text-green-600">Online</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Companies Management</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {companies.map((company) => (
                                    <tr key={company._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    {company.logoUrl ? (
                                                        <img className="h-10 w-10 rounded-full" src={company.logoUrl} alt={company.name} />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-600">
                                                                {company.name?.charAt(0)?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                                    <div className="text-sm text-gray-500">{company.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.industry || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex space-x-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {company.stats?.admins || 0} Admins
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {company.stats?.managers || 0} Managers
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    {company.stats?.employees || 0} Employees
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(company.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => openEditModal(company)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCompany(company._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Company Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Company</h3>
                            <form onSubmit={handleCreateCompany} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Industry</label>
                                    <input
                                        type="text"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Edit Company Modal */}
            <EnhancedEditCompanyModal
                showModal={showEditModal}
                setShowModal={setShowEditModal}
                formData={formData}
                setFormData={setFormData}
                handleEditCompany={handleEditCompany}
            />
        </div>
    );
};

export default SuperAdminDashboard;
