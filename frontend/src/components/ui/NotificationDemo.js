import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationDemo = () => {
  const { success, error, warning, info } = useNotification();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Notification Demo</h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => success('Operation completed successfully!')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Show Success
        </button>
        
        <button
          onClick={() => error('Something went wrong!')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Show Error
        </button>
        
        <button
          onClick={() => warning('Please check your input!')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Show Warning
        </button>
        
        <button
          onClick={() => info('Here is some information!')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Show Info
        </button>
      </div>
    </div>
  );
};

export default NotificationDemo;
