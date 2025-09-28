import React from 'react';

const TailwindTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/30">
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          Tailwind CSS Test
        </h1>
        <div className="space-y-4">
          <div className="bg-blue-500 text-white p-4 rounded-lg">
            <p className="font-semibold">✅ Tailwind is working!</p>
          </div>
          <div className="bg-green-500 text-white p-4 rounded-lg">
            <p className="font-semibold">✅ Gradients are working!</p>
          </div>
          <div className="bg-purple-500 text-white p-4 rounded-lg">
            <p className="font-semibold">✅ Backdrop blur is working!</p>
          </div>
          <div className="bg-red-500 text-white p-4 rounded-lg animate-pulse">
            <p className="font-semibold">✅ Animations are working!</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-white/80">
            If you can see this styled page, Tailwind CSS is properly configured!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;
