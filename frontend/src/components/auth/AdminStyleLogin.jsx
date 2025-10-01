import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../utils/authUtils';
import { showSuccess, showError } from '../../utils/toast';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Building,
    User,
    Shield,
    Users,
    AlertCircle,
    ArrowRight,
    Clock,
    BarChart3,
    TrendingUp,
    Crown,
    Settings
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CompanyLogo from '../ui/CompanyLogo';

const AdminStyleLogin = () => {
    const { login, isAuthenticated, loading, error, clearError } = useAuth();
    const navigate = useNavigate();

    const [userType, setUserType] = useState('admin');
    const [formData, setFormData] = useState({
        company: 'ASOPALAV',
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleUserTypeChange = (type) => {
        console.log('User type changed to:', type);
        setUserType(type);
        setFormData({ company: 'HARIKRISHNA', email: '', password: '' });
        setValidationErrors({});
        clearError();
    };

    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
        clearError();
    };

    const validateForm = () => {
        const errors = {};

        if (userType === 'admin' && !formData.company.trim()) {
            errors.company = 'Company code is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!formData.password.trim()) {
            errors.password = 'Password is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        clearError();

        try {
            // Handle SuperAdmin login separately
            if (userType === 'superadmin') {
                const response = await fetch(`http://localhost:5678/api/superadmin/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    // Store SuperAdmin token and user data
                    localStorage.setItem('superadmin_token', data.token);
                    localStorage.setItem('superadmin_user', JSON.stringify(data.user));
                    localStorage.setItem('user_role', 'superadmin');

                    showSuccess('SuperAdmin login successful!');
                    navigate('/superadmin/dashboard');
                } else {
                    showError(data.message || 'SuperAdmin login failed');
                }
                return;
            }

            // Handle regular user login
            const loginData = {
                ...formData,
                userType: userType
            };

            console.log('Attempting login with data:', loginData);
            console.log('User type:', userType);
            console.log('Form data:', formData);

            const result = await login(loginData);
            console.log('Login result:', result);

            if (result.success) {
                // Redirect based on user type
                const dashboardPath = userType === 'admin' ? '/admin/dashboard' :
                    userType === 'manager' ? '/manager/dashboard' :
                        '/employee/dashboard';
                console.log('Redirecting to:', dashboardPath);
                console.log('User type:', userType);
                console.log('Is authenticated:', isAuthenticated);
                console.log('Login result data:', result.data);

                // Force navigation immediately
                navigate(dashboardPath);
            } else {
                console.error('Login failed:', result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect to appropriate dashboard based on user type
        const userType = localStorage.getItem('userType') || 'admin';
        const dashboardPath = userType === 'admin' ? '/admin/dashboard' :
            userType === 'manager' ? '/manager/dashboard' :
                '/employee/dashboard';

        console.log('AdminStyleLogin - User is authenticated, redirecting to:', dashboardPath);
        console.log('AdminStyleLogin - User type from localStorage:', userType);
        console.log('AdminStyleLogin - isAuthenticated:', isAuthenticated);

        // Use setTimeout to avoid blocking the render
        setTimeout(() => {
            console.log('AdminStyleLogin - Executing navigation to:', dashboardPath);
            navigate(dashboardPath);
        }, 100);

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Redirecting to dashboard...</p>
                    <button
                        onClick={() => {
                            clearAuthData();
                            window.location.reload();
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-800 underline"
                    >
                        Login as different user
                    </button>
                </div>
            </div>
        );
    }

    const getIconComponent = () => {
        switch (userType) {
            case 'admin':
                return Shield;
            case 'manager':
                return Users;
            case 'employee':
                return User;
            case 'superadmin':
                return Crown;
            default:
                return Shield;
        }
    };

    const IconComponent = getIconComponent();

    // Dashboard-style stats for visual appeal
    const DASHBOARD_STATS = [
        {
            title: 'Total Users',
            value: '1,247',
            change: '+12%',
            changeType: 'positive',
            icon: Users,
            color: 'blue'
        },
        {
            title: 'Active Sessions',
            value: '89',
            change: '+8%',
            changeType: 'positive',
            icon: Clock,
            color: 'green'
        },
        {
            title: 'System Health',
            value: '99.9%',
            change: '+0.1%',
            changeType: 'positive',
            icon: BarChart3,
            color: 'purple'
        },
        {
            title: 'Performance',
            value: 'Excellent',
            change: '+5%',
            changeType: 'positive',
            icon: TrendingUp,
            color: 'orange'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Left Side - Dashboard Preview */}


                {/* Right Side - Login Form */}
                <div className="w-full lg:w-full flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        {/* Login Card */}
                        <Card className="shadow-xl">
                            <CardHeader className="text-center pb-6">
                                <div className="flex justify-center mb-4">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                                    </div>
                                </div>
                                {/* Company Logo Display */}
                                {/* <div className="flex justify-center mb-4">
                                    <CompanyLogo
                                        companyCode={formData.company}
                                        size="lg"
                                        className="shadow-lg"
                                        style={{
                                            minWidth: '64px',
                                            minHeight: '64px',
                                            maxWidth: '64px',
                                            maxHeight: '64px'
                                        }}
                                    />
                                </div> */}
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    {userType === 'admin' ? 'Admin Access' :
                                        userType === 'manager' ? 'Manager Portal' :
                                            userType === 'superadmin' ? 'SuperAdmin Portal' : 'Employee Login'}
                                </CardTitle>
                                <p className="text-gray-600 mt-2">
                                    {userType === 'admin' ? 'Enterprise Dashboard Access' :
                                        userType === 'manager' ? 'Team Management Portal' :
                                            userType === 'superadmin' ? 'System Administration Access' : 'Personal Workspace'}
                                </p>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* User Type Selector */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700">Login As</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'admin', label: 'Admin', icon: Shield, color: 'blue' },
                                            { key: 'manager', label: 'Manager', icon: Users, color: 'purple' },
                                            { key: 'employee', label: 'Employee', icon: User, color: 'green' },
                                            { key: 'superadmin', label: 'SuperAdmin', icon: Crown, color: 'red' }
                                        ].map(({ key, label, icon, color }) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleUserTypeChange(key)}
                                                className={`flex flex-col items-center space-y-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${userType === key
                                                    ? `bg-${color}-100 text-${color}-700 border-2 border-${color}-200`
                                                    : 'text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
                                                    }`}
                                            >
                                                {React.createElement(icon, { className: "h-4 w-4 sm:h-5 sm:w-5" })}
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mr-3 flex-shrink-0" />
                                            <span className="text-red-700 text-sm font-medium">{error}</span>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Company Code - Only for Admin */}
                                    {/* {userType === 'admin' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                                                Company Code
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Enter your company code"
                                                value={formData.company}
                                                onChange={handleInputChange('company')}
                                                disabled={isSubmitting}
                                                className={validationErrors.company ? 'border-red-300 focus:border-red-500' : ''}
                                            />
                                            {validationErrors.company && (
                                                <p className="text-red-600 text-sm">{validationErrors.company}</p>
                                            )}
                                        </div>
                                    )} */}

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500" />
                                            Email Address
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={handleInputChange('email')}
                                            disabled={isSubmitting}
                                            className={validationErrors.email ? 'border-red-300 focus:border-red-500' : ''}
                                        />
                                        {validationErrors.email && (
                                            <p className="text-red-600 text-sm">{validationErrors.email}</p>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-500" />
                                            Password
                                        </label>
                                        <div className="relative w-full flex" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: '15px' }}>
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter your password"
                                                value={formData.password}
                                                onChange={handleInputChange('password')}
                                                disabled={isSubmitting}
                                                className={`w-full pr-10 ${validationErrors.password ? 'border-red-300 focus:border-red-500' : ''}`}
                                            />
                                            <div style={{ display: 'flex', position: 'relative' }}>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    disabled={isSubmitting}
                                                    className="absolute 20 ml-5 top-5 focus:border-none -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-5 w-5" />
                                                    ) : (
                                                        <Eye className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>

                                        </div>


                                        {validationErrors.password && (
                                            <p className="text-red-600 text-sm">{validationErrors.password}</p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center space-x-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                <span>Signing In...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign In</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* Additional Links */}
                                <div className="space-y-4 pt-4 border-t border-gray-200">
                                    <div className="text-center">
                                        <a
                                            href="/forgot-password"
                                            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                        >
                                            Forgot your password?
                                        </a>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">
                                            {userType === 'admin' ? 'Need help? Contact your system administrator' :
                                                userType === 'manager' ? 'Need help? Contact your admin' :
                                                    userType === 'superadmin' ? 'System administration access - highest privileges' : 'Need help? Contact your manager or HR'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStyleLogin;
