import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const Pagination = ({
    pagination,
    onPageChange,
    loading = false,
    className = ""
}) => {
    if (!pagination || pagination.totalPages <= 1) {
        return null;
    }

    const { currentPage, totalPages, totalRecords, limit, hasNextPage, hasPrevPage } = pagination;

    const startRecord = ((currentPage - 1) * limit) + 1;
    const endRecord = Math.min(currentPage * limit, totalRecords);

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-4 sm:space-y-0 ${className}`}>
            {/* Records Info */}
            <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {startRecord} to {endRecord} of {totalRecords} records
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center space-x-2">
                <Button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage || loading}
                    variant="outline"
                    size="sm"
                    className="text-sm touch-manipulation min-h-[44px] flex items-center space-x-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                    {getPageNumbers(currentPage, totalPages).map((page, index) => (
                        <Button
                            key={index}
                            onClick={() => onPageChange(page)}
                            disabled={loading}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            className={`text-sm touch-manipulation min-h-[44px] min-w-[44px] ${page === currentPage
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'hover:bg-gray-50'
                                }`}
                        >
                            {page === '...' ? '...' : page}
                        </Button>
                    ))}
                </div>

                <Button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage || loading}
                    variant="outline"
                    size="sm"
                    className="text-sm touch-manipulation min-h-[44px] flex items-center space-x-1"
                >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

// Helper function to generate page numbers with ellipsis
const getPageNumbers = (currentPage, totalPages) => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
            pages.push('...');
        }

        // Show pages around current page
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            if (i !== 1 && i !== totalPages) {
                pages.push(i);
            }
        }

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        // Always show last page
        if (totalPages > 1) {
            pages.push(totalPages);
        }
    }

    return pages;
};

export default Pagination;
