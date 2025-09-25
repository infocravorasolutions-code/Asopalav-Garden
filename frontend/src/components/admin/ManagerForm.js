import React, { useState, useEffect } from 'react';
import { useManager } from '../../contexts/ManagerContext';
import toast from 'react-hot-toast';

const ManagerForm = ({ manager = null, onClose, onSuccess }) => {
  const { createManager, updateManager, isLoading } = useManager();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    status: 'active',
    location: '68b20a0bbeb415c7d83c0c2c'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (manager) {
      setFormData({
        name: manager.name || '',
        email: manager.email || '',
        mobile: manager.mobile || '',
        address: manager.address || '',
        password: '',
        status: manager.status || 'active',
        location: manager.location || '68b20a0bbeb415c7d83c0c2c'
      });
    }
  }, [manager]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!manager && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = { 
        ...formData,
        location: '68b20a0bbeb415c7d83c0c2c' // Always use RiverFront House ObjectId
      };
      
      // Remove password if empty (for updates)
      if (!submitData.password) {
        delete submitData.password;
      }

      if (manager) {
        // Update existing manager
        await updateManager(manager._id, submitData);
        toast.success('Manager updated successfully!');
      } else {
        // Create new manager
        await createManager(submitData);
        toast.success('Manager created successfully!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is already handled in context
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
          placeholder="Enter manager name"
          required
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`input-field w-full ${errors.email ? 'border-red-500' : ''}`}
          placeholder="Enter email address"
          required
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Mobile *
        </label>
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          className={`input-field w-full ${errors.mobile ? 'border-red-500' : ''}`}
          placeholder="Enter mobile number"
          required
        />
        {errors.mobile && (
          <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Address *
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={`input-field w-full ${errors.address ? 'border-red-500' : ''}`}
          placeholder="Enter address"
          rows="3"
          required
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Location *
        </label>
        <input
          type="text"
          name="location"
          value="RiverFront"
          readOnly
          className="input-field w-full bg-gray-100 cursor-not-allowed"
          placeholder="RiverFront"
        />
        <p className="text-sm text-gray-500 mt-1">Location is automatically set to RiverFront House</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {manager ? 'New Password (leave blank to keep current)' : 'Password *'}
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`input-field w-full ${errors.password ? 'border-red-500' : ''}`}
          placeholder={manager ? 'Enter new password' : 'Enter password'}
          required={!manager}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      {manager && (
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Status
          </label>
          <select 
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input-field w-full"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary order-2 sm:order-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary order-1 sm:order-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {manager ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            manager ? 'Update Manager' : 'Add Manager'
          )}
        </button>
      </div>
    </form>
  );
};

export default ManagerForm;
