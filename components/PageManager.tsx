import React from 'react';
import { PageData } from '../types';
import PageCard from './PageCard';
import { PlusIcon } from './icons';

interface PageManagerProps {
    pages: PageData[];
    onAddPage: () => void;
    onDeletePage: (index: number) => void;
    onOpenPageAiModal: (index: number) => void;
}

const PageManager: React.FC<PageManagerProps> = ({ pages, onAddPage, onDeletePage, onOpenPageAiModal }) => {
    return (
        <div className="bg-editor-canvas p-4 md:p-10 flex-grow overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {pages.map((page, index) => (
                    <PageCard 
                        key={page.id}
                        pageData={page}
                        pageIndex={index}
                        onDelete={() => onDeletePage(index)}
                        onGenerateWithAi={() => onOpenPageAiModal(index)}
                    />
                ))}
                <button
                    onClick={onAddPage}
                    className="flex flex-col items-center justify-center p-6 bg-panel border-2 border-dashed border-main rounded-lg hover:border-indigo-500 hover:bg-indigo-500/5 text-subtle hover:text-indigo-400 transition-colors duration-300"
                    style={{ aspectRatio: '8.5 / 11' }} // Default to portrait aspect ratio
                >
                    <div className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center mb-4">
                        <PlusIcon className="h-8 w-8" />
                    </div>
                    <span className="font-semibold text-center">Añadir Nueva Página</span>
                </button>
            </div>
        </div>
    );
};

export default PageManager;