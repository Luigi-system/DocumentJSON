import React from 'react';
import { PageData } from '../types';
import { TrashIcon, MagicWandIcon } from './icons';

interface PageCardProps {
    pageData: PageData;
    pageIndex: number;
    onDelete: () => void;
    onGenerateWithAi: () => void;
}

const PageCard: React.FC<PageCardProps> = ({ pageData, pageIndex, onDelete, onGenerateWithAi }) => {
    const isLandscape = pageData.properties.orientation === 'Landscape';
    const aspectRatio = isLandscape ? '11 / 8.5' : '8.5 / 11';

    return (
        <div className="group relative flex flex-col">
            <div 
                className="bg-white rounded-md shadow-lg border border-main overflow-hidden relative transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-xl"
                style={{ aspectRatio }}
            >
                {/* Schematic preview */}
                <div className="absolute inset-0 p-2 space-y-1 overflow-hidden">
                    {pageData.widgets.slice(0, 5).map(w => {
                        let bgColor = 'bg-gray-200';
                        if(w.type === 'Title') bgColor = 'bg-gray-400 h-2';
                        if(w.type === 'Image') bgColor = 'bg-blue-200';
                        if(w.type === 'Table') bgColor = 'bg-green-200';
                        
                        return (
                            <div key={w.id} className={`w-full h-1.5 rounded-sm ${bgColor}`}></div>
                        )
                    })}
                </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-2 space-x-2">
                    <button onClick={onGenerateWithAi} title="Generar con IA" className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-indigo-600 hover:bg-white hover:scale-110 transition-all">
                        <MagicWandIcon className="h-5 w-5" />
                    </button>
                    <button onClick={onDelete} title="Eliminar Página" className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-white hover:scale-110 transition-all">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <p className="text-center text-sm font-semibold mt-2 text-main">
                Página {pageIndex + 1}
            </p>
        </div>
    );
};

export default PageCard;
