import React, { useState, useEffect } from 'react';

const PerformanceMonitor = ({ children, operation = 'operation' }) => {
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [duration, setDuration] = useState(null);

    useEffect(() => {
        if (startTime && endTime) {
            setDuration(endTime - startTime);
        }
    }, [startTime, endTime]);

    const startTimer = () => {
        setStartTime(performance.now());
    };

    const endTimer = () => {
        setEndTime(performance.now());
    };

    const resetTimer = () => {
        setStartTime(null);
        setEndTime(null);
        setDuration(null);
    };

    // Expose timer functions to parent
    React.useImperativeHandle(React.forwardRef(() => { }), () => ({
        startTimer,
        endTimer,
        resetTimer,
        duration
    }));

    return (
        <div className="performance-monitor">
            {children}
            {duration && (
                <div className="fixed bottom-4 right-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                    {operation} completed in {duration.toFixed(2)}ms
                </div>
            )}
        </div>
    );
};

export default PerformanceMonitor;
