import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Building,
    User,
    Shield
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import { authAPI } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState('email'); // 'email', 'reset', 'success'
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Get token and user type from URL params
    const token = searchParams.get('token');
    const userType = searchParams.get('type');

    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [validationErrors, setValidationErrors] = useState({});

    // If token exists, go directly to reset step
    React.useEffect(() => {
        if (token && userType) {
            setStep('reset');
            verifyToken();
        }
    }, [token, userType]);

    const verifyToken = async () => {
        try {
            setLoading(true);
            await authAPI.verifyResetToken(token, userType);
        } catch (error) {
            showError('Invalid or expired reset link');
            setStep('email');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (step === 'email') {
            if (!formData.email.trim()) {
                errors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                errors.email = 'Please enter a valid email address';
            }
        } else if (step === 'reset') {
            if (!formData.newPassword.trim()) {
                errors.newPassword = 'New password is required';
            } else if (formData.newPassword.length < 6) {
                errors.newPassword = 'Password must be at least 6 characters';
            }

            if (!formData.confirmPassword.trim()) {
                errors.confirmPassword = 'Please confirm your password';
            } else if (formData.newPassword !== formData.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSendResetEmail = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            await authAPI.forgotPassword(formData.email, 'admin'); // Default to admin, can be made dynamic
            setStep('success');
            showSuccess('Password reset email sent successfully!');
        } catch (error) {
            showError(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            await authAPI.resetPassword(token, formData.newPassword, userType);
            setStep('success');
            showSuccess('Password reset successfully!');
        } catch (error) {
            showError(error.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const getUserTypeIcon = () => {
        switch (userType) {
            case 'admin':
                return Shield;
            case 'manager':
                return Building;
            case 'employee':
                return User;
            default:
                return Shield;
        }
    };

    const getUserTypeLabel = () => {
        switch (userType) {
            case 'admin':
                return 'Admin';
            case 'manager':
                return 'Manager';
            case 'employee':
                return 'Employee';
            default:
                return 'User';
        }
    };

    const IconComponent = getUserTypeIcon();

    if (loading && step === 'reset') {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl">
                    <CardHeader className="text-center pb-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <IconComponent className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            {step === 'email' ? 'Forgot Password' :
                                step === 'reset' ? 'Reset Password' : 'Password Reset'}
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            {step === 'email' ? 'Enter your email to receive reset instructions' :
                                step === 'reset' ? `Set a new password for your ${getUserTypeLabel()} account` :
                                    'Your password has been reset successfully'}
                        </p>
                    </CardHeader>

                    <CardContent>
                        {step === 'email' && (
                            <form onSubmit={handleSendResetEmail} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                        <Mail className="h-4 w-4 mr-2 text-blue-500" />
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={formData.email}
                                        onChange={handleInputChange('email')}
                                        disabled={loading}
                                        className={validationErrors.email ? 'border-red-300 focus:border-red-500' : ''}
                                    />
                                    {validationErrors.email && (
                                        <p className="text-red-600 text-sm">{validationErrors.email}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Email'}
                                </Button>
                            </form>
                        )}

                        {step === 'reset' && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                        <Lock className="h-4 w-4 mr-2 text-blue-500" />
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter new password"
                                            value={formData.newPassword}
                                            onChange={handleInputChange('newPassword')}
                                            disabled={loading}
                                            className={`pr-10 ${validationErrors.newPassword ? 'border-red-300 focus:border-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors p-1 rounded w-6 h-6"
                                            disabled={loading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {validationErrors.newPassword && (
                                        <p className="text-red-600 text-sm">{validationErrors.newPassword}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                        <Lock className="h-4 w-4 mr-2 text-blue-500" />
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm new password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange('confirmPassword')}
                                            disabled={loading}
                                            className={`pr-10 ${validationErrors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors p-1 rounded w-6 h-6"
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {validationErrors.confirmPassword && (
                                        <p className="text-red-600 text-sm">{validationErrors.confirmPassword}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </form>
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <CheckCircle className="h-16 w-16 text-green-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Password Reset Successful!
                                </h3>
                                <p className="text-gray-600">
                                    Your password has been updated successfully. You can now log in with your new password.
                                </p>
                                <Button
                                    onClick={() => navigate('/login')}
                                    variant="primary"
                                    className="w-full"
                                >
                                    Go to Login
                                </Button>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
