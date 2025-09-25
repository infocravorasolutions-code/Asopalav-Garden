import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Building2, User, Shield } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'supervisor', // Default to supervisor
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password, formData.role);
    
    if (result.success) {
      // The login function will handle the redirect based on the actual user role
      // We don't need to navigate here as the AuthContext will handle it
      // console.log('Login successful, user role will be handled by AuthContext');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-secondary-600">
            Sign in to your Panther Secure account
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Login As
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'supervisor' })}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.role === 'supervisor'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-300 bg-white text-secondary-600 hover:border-secondary-400'
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.role === 'admin'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-300 bg-white text-secondary-600 hover:border-secondary-400'
                  }`}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'employee' })}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.role === 'employee'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-300 bg-white text-secondary-600 hover:border-secondary-400'
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  Employee
                </button>
              </div>
            </div>

            {/* Email/Employee Code Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                {formData.role === 'employee' ? 'Email or Employee Code' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {formData.role === 'employee' ? (
                    <User className="h-5 w-5 text-secondary-400" />
                  ) : (
                    <Mail className="h-5 w-5 text-secondary-400" />
                  )}
                </div>
                <input
                  id="email"
                  name="email"
                  type={formData.role === 'employee' ? 'text' : 'email'}
                  autoComplete={formData.role === 'employee' ? 'username' : 'email'}
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder={formData.role === 'employee' ? 'Enter email or employee code' : 'Enter your email'}
                />
              </div>
              {formData.role === 'employee' && (
                <p className="mt-1 text-xs text-secondary-500">
                  You can login using your email address or employee code
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder={formData.role === 'employee' ? 'Enter your employee code' : 'Enter your password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
              {formData.role === 'employee' && (
                <p className="mt-1 text-xs text-secondary-500">
                  Your password is your employee code
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Signing in...
                </>
                             ) : (
                 `Sign In as ${formData.role === 'admin' ? 'Admin' : formData.role === 'employee' ? 'Employee' : 'Supervisor'}`
               )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot your password?
            </Link>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-secondary-500">
            Employee Management System v1.0.1
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
