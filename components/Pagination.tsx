import React from 'react';
import { PlusIcon } from './icons';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onAddPage: () => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, onAddPage }) => {
    return (
        <div className="flex items-center justify-center space-x-4 p-2 bg-panel rounded-full shadow-md border border-main">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm font-medium text-subtle rounded-md hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Anterior
            </button>
            <span className="text-sm font-semibold text-main">
                Página {currentPage} de {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm font-medium text-subtle rounded-md hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Siguiente
            </button>
            <div className="w-px h-5 bg-main mx-2"></div>
            <button
                onClick={onAddPage}
                className="flex items-center space-x-1 px-3 py-1 bg-tertiary text-indigo-600 font-semibold rounded-md hover:bg-opacity-70 border border-main transition-colors"
            >
                <PlusIcon className="h-4 w-4" />
                <span>Añadir Página</span>
            </button>
        </div>
    );
};

export default Pagination;
