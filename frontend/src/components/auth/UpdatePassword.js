import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff, Key, User, Shield } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UpdatePassword = () => {
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [role, setRole] = useState('supervisor'); // Default to supervisor
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      // Determine userType based on selected role
      const userType = role === 'admin' ? 'admin' : 'manager';
      
      // Call API to update password with userType
      await authAPI.updatePassword({
        otp: formData.otp,
        newPassword: formData.newPassword,
        userType,
      });
      
      toast.success('Password updated successfully!');
      navigate('/login');
      
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Update Password
          </h2>
          <p className="text-secondary-600">
            Enter the 6-digit OTP and your new password
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('supervisor')}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    role === 'supervisor'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-300 bg-white text-secondary-600 hover:border-secondary-400'
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    role === 'admin'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-300 bg-white text-secondary-600 hover:border-secondary-400'
                  }`}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Admin
                </button>
              </div>
            </div>

            {/* OTP Field */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-secondary-700 mb-2">
                6-Digit OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  required
                  value={formData.otp}
                  onChange={handleChange}
                  className="input-field pl-10 text-center text-lg tracking-widest"
                  placeholder="000000"
                  pattern="[0-9]{6}"
                />
              </div>
              <p className="text-xs text-secondary-500 mt-1">
                Enter the 6-digit OTP sent to your email
              </p>
            </div>

            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter new password"
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
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
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
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-secondary-600 hover:text-secondary-700 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
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

export default UpdatePassword;
