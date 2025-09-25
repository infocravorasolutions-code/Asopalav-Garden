import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, User, Shield } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('supervisor'); // Default to supervisor
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      
      // Determine userType based on selected role
      const userType = role === 'admin' ? 'admin' : 'manager';
      
      // Call API to send OTP with userType
      await authAPI.forgotPassword({ email, userType });
      
      setOtpSent(true);
      toast.success('OTP has been sent to your email address');
      
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      const userType = role === 'admin' ? 'admin' : 'manager';
      await authAPI.resendOTP({ email, userType });
      toast.success('OTP has been resent to your email address');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
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
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            {otpSent ? 'Check Your Email' : 'Forgot Password'}
          </h2>
          <p className="text-secondary-600">
            {otpSent 
              ? 'We\'ve sent a 6-digit OTP to your email address'
              : 'Enter your email address to receive a password reset OTP'
            }
          </p>
        </div>

        {/* Form */}
        <div className="card">
          {!otpSent ? (
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

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your email address"
                  />
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
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send OTP
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-secondary-600 mb-4">
                  We've sent a 6-digit OTP to <strong>{email}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  to="/update-password"
                  className="btn-primary w-full flex justify-center items-center"
                >
                  Enter OTP & Update Password
                </Link>
                
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="btn-secondary w-full flex justify-center items-center"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Resending...
                    </>
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              </div>
            </div>
          )}

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

export default ForgotPassword;
