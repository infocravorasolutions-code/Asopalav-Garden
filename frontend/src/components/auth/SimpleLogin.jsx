import React, { useState } from 'react';

const SimpleLogin = () => {
  const [userType, setUserType] = useState('admin');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Login Test</h1>
          <p className="text-blue-200">This is a simple test to check if the login page loads</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-white/90 text-sm font-bold">User Type</label>
            <select 
              value={userType} 
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          
          <div>
            <label className="text-white/90 text-sm font-bold">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div>
            <label className="text-white/90 text-sm font-bold">Password</label>
            <input 
              type="password" 
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300">
            Sign In
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Current User Type: <span className="text-blue-300 font-bold">{userType}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
