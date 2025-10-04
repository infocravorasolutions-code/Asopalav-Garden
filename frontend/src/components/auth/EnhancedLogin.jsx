import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building,
  AlertCircle,
  CheckCircle,
  Users,
  Clock,
  MapPin,
  Shield,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Loading from '../ui/Loading';

const EnhancedLogin = () => {
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.company) {
      errors.company = 'Company code is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const result = await login(formData);

      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        // Error is handled by the context
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <Loading text="Loading your workspace..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f9ff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-green-100 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-40 w-12 h-12 bg-purple-100 rounded-full opacity-20 animate-pulse delay-2000"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* Left Side - Branding & Features */}
            <div className="hidden lg:block space-y-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Pro</h1>
                    <p className="text-gray-600">Multi-Company Management System</p>
                  </div>
                </div>

                <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                  Welcome to the future of
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                    {" "}attendance management
                  </span>
                </h2>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Streamline your workforce management with our comprehensive attendance tracking system.
                  Built for modern companies that value efficiency and transparency.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Multi-Company</h3>
                    <p className="text-sm text-gray-600">Manage multiple companies from one platform</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">GPS Tracking</h3>
                    <p className="text-sm text-gray-600">Location-based attendance verification</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Real-time</h3>
                    <p className="text-sm text-gray-600">Live attendance monitoring and alerts</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Reports</h3>
                    <p className="text-sm text-gray-600">Advanced analytics and insights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full max-w-md mx-auto">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Sign In
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Access your company dashboard
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Global Error */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                          <span className="text-red-700 text-sm">{error}</span>
                        </div>
                      </div>
                    )}

                    {/* Company Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Company Code
                      </label>
                      <Input
                        placeholder="Enter your company code"
                        value={formData.company}
                        onChange={handleInputChange('company')}
                        error={validationErrors.company}
                        required
                        disabled={isSubmitting}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        error={validationErrors.email}
                        required
                        disabled={isSubmitting}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleInputChange('password')}
                          error={validationErrors.password}
                          required
                          disabled={isSubmitting}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors p-1 rounded w-6 h-6"
                          disabled={isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:transform-none disabled:shadow-none"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Signing In...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          Sign In
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Additional Links */}
                  <div className="mt-6 space-y-3">
                    <div className="text-center">
                      <a
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-500 transition-colors font-medium"
                      >
                        Forgot your password?
                      </a>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Need help? Contact your system administrator
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Demo Credentials
                </h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <p><strong>Company:</strong> ASOPALAV</p>
                  <p><strong>Email:</strong> rajesh@asopalav.com</p>
                  <p><strong>Password:</strong> admin123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;
