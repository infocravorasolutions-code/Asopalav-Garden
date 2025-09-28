import React, { useState } from 'react';
import Input from '../ui/Input';
import { User, Mail, Lock, Phone, MapPin, Search, Calendar, DollarSign } from 'lucide-react';

const InputExamples = () => {
  const [formData, setFormData] = useState({
    basic: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    search: '',
    date: '',
    amount: '',
    textarea: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Form submitted successfully!');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Input Component Examples
          </h1>
          <p className="text-gray-600">
            Comprehensive, responsive input components for your attendance management system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Examples */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Inputs</h2>
              
              <div className="space-y-4">
                {/* Basic Text Input */}
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.basic}
                  onChange={handleInputChange('basic')}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />

                {/* Email Input */}
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email}
                  required
                />

                {/* Password Input */}
                <Input
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  leftIcon={<Lock className="h-4 w-4" />}
                  showPasswordToggle
                  error={errors.password}
                  required
                />

                {/* Phone Input */}
                <Input
                  type="tel"
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={errors.phone}
                  required
                />
              </div>
            </div>

            {/* Size Variants */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Size Variants</h2>
              
              <div className="space-y-4">
                <Input
                  size="sm"
                  placeholder="Small input"
                  value=""
                  onChange={() => {}}
                />
                
                <Input
                  size="md"
                  placeholder="Medium input (default)"
                  value=""
                  onChange={() => {}}
                />
                
                <Input
                  size="lg"
                  placeholder="Large input"
                  value=""
                  onChange={() => {}}
                />
              </div>
            </div>
          </div>

          {/* Advanced Examples */}
          <div className="space-y-6">
            {/* Variant Styles */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Variant Styles</h2>
              
              <div className="space-y-4">
                <Input
                  variant="default"
                  placeholder="Default variant"
                  value=""
                  onChange={() => {}}
                />
                
                <Input
                  variant="filled"
                  placeholder="Filled variant"
                  value=""
                  onChange={() => {}}
                />
                
                <Input
                  variant="outlined"
                  placeholder="Outlined variant"
                  value=""
                  onChange={() => {}}
                />
              </div>
            </div>

            {/* Specialized Inputs */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialized Inputs</h2>
              
              <div className="space-y-4">
                {/* Search Input */}
                <Input
                  label="Search"
                  placeholder="Search employees..."
                  value={formData.search}
                  onChange={handleInputChange('search')}
                  leftIcon={<Search className="h-4 w-4" />}
                />

                {/* Date Input */}
                <Input
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={handleInputChange('date')}
                  leftIcon={<Calendar className="h-4 w-4" />}
                />

                {/* Amount Input */}
                <Input
                  type="number"
                  label="Amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange('amount')}
                  leftIcon={<DollarSign className="h-4 w-4" />}
                  step="0.01"
                />

                {/* Address Input */}
                <Input
                  label="Address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* States */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Input States</h2>
              
              <div className="space-y-4">
                <Input
                  placeholder="Normal state"
                  value=""
                  onChange={() => {}}
                />
                
                <Input
                  placeholder="Loading state"
                  value=""
                  onChange={() => {}}
                  loading
                />
                
                <Input
                  placeholder="Disabled state"
                  value="Disabled input"
                  onChange={() => {}}
                  disabled
                />
                
                <Input
                  placeholder="Read only state"
                  value="Read only input"
                  onChange={() => {}}
                  readOnly
                />
                
                <Input
                  placeholder="Error state"
                  value=""
                  onChange={() => {}}
                  error="This field is required"
                />
                
                <Input
                  placeholder="Success state"
                  value="Valid input"
                  onChange={() => {}}
                  success="Input is valid"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Example */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Form Example</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.basic}
                  onChange={handleInputChange('basic')}
                  required
                />
                
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  value=""
                  onChange={() => {}}
                  required
                />
              </div>
              
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange('email')}
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email}
                required
              />
              
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange('password')}
                leftIcon={<Lock className="h-4 w-4" />}
                showPasswordToggle
                error={errors.password}
                required
              />
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Responsive Demo */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsive Design</h2>
            <p className="text-gray-600 mb-4">
              The input components are fully responsive and adapt to different screen sizes.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Mobile First"
                placeholder="Responsive input"
                value=""
                onChange={() => {}}
              />
              <Input
                label="Tablet Friendly"
                placeholder="Responsive input"
                value=""
                onChange={() => {}}
              />
              <Input
                label="Desktop Ready"
                placeholder="Responsive input"
                value=""
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputExamples;
