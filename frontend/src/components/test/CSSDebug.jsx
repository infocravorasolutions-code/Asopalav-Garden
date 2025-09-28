import React from 'react';

const CSSDebug = () => {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          CSS Debug Test
        </h1>
        <div className="space-y-4">
          <div className="bg-blue-500 text-white p-4 rounded">
            <p className="text-lg font-semibold">If you see this styled, Tailwind is working!</p>
          </div>
          <div className="bg-green-500 text-white p-4 rounded">
            <p className="text-lg font-semibold">Colors should be working!</p>
          </div>
          <div className="bg-purple-500 text-white p-4 rounded animate-pulse">
            <p className="text-lg font-semibold">Animations should work!</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            If this page looks unstyled (plain text), Tailwind CSS is not working.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CSSDebug;
