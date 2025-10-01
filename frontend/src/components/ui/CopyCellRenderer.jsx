import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CopyCellRenderer = ({ value, field }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();

        try {
            // Handle different data types
            let textToCopy = value;

            if (typeof value === 'object' && value !== null) {
                textToCopy = JSON.stringify(value, null, 2);
            } else if (value === null || value === undefined) {
                textToCopy = '';
            } else {
                textToCopy = String(value);
            }

            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            toast.success(`${field || 'Value'} copied to clipboard!`);

            // Reset copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            toast.error('Failed to copy to clipboard');
        }
    };

    return (
        <div className="flex items-center justify-between w-full group">
            <div className="flex-1 pr-2 break-words">
                {value || 'N/A'}
            </div>
            <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded flex-shrink-0"
                title={`Copy ${field || 'value'}`}
            >
                {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                ) : (
                    <Copy className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                )}
            </button>
        </div>
    );
};

export default CopyCellRenderer;
