import React, { useState, useRef } from 'react';
import { AiWidgetGenerationResponse, WidgetType } from '../types';
import { generatePageContentFromFiles } from '../services/geminiService';
import { CloseIcon, MagicWandIcon, UploadIcon } from './icons';
import { FileTreeView, FileNode, buildFileTree } from './FileTreeView';
import { AVAILABLE_WIDGETS_FOR_DOCS } from '../constants';

interface PageAiGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (pageIndex: number, widgets: AiWidgetGenerationResponse) => void;
    pageIndex: number | null;
}

const PageAiGeneratorModal: React.FC<PageAiGeneratorModalProps> = ({ isOpen, onClose, onApply, pageIndex }) => {
    const [view, setView] = useState<'upload' | 'config' | 'analyzing' | 'error'>('upload');
    const [allFiles, setAllFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [allowedWidgets, setAllowedWidgets] = useState<WidgetType[]>(AVAILABLE_WIDGETS_FOR_DOCS);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setAllFiles(Array.from(files));
        setView('config');
    };

    const handleGenerate = async () => {
        if (allFiles.length === 0) {
            setError("Por favor, sube al menos un archivo.");
            return;
        }
        if (pageIndex === null) {
            setError("No se ha especificado una página de destino.");
            return;
        }

        setView('analyzing');
        setError(null);

        try {
            const fileContents = await Promise.all(
                allFiles.map(file => 
                    file.text().then(content => ({ path: file.webkitRelativePath || file.name, content }))
                )
            );

            const widgets = await generatePageContentFromFiles(fileContents, { allowedWidgets });
            onApply(pageIndex, widgets);
            resetAndClose();

        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado durante el análisis.');
            setView('error');
        }
    };

    const resetAndClose = () => {
        setView('upload');
        setAllFiles([]);
        setError(null);
        setAllowedWidgets(AVAILABLE_WIDGETS_FOR_DOCS);
        if (inputRef.current) inputRef.current.value = "";
        onClose();
    };

    if (!isOpen) return null;

    const handleWidgetToggle = (widgetType: WidgetType) => {
        setAllowedWidgets(current => {
            const newSet = new Set(current);
            if (newSet.has(widgetType)) {
                newSet.delete(widgetType);
            } else {
                newSet.add(widgetType);
            }
            return Array.from(newSet);
        });
    };

    const renderContent = () => {
        switch(view) {
            case 'upload':
                return (
                    <div className="text-center">
                        <p className="text-sm text-subtle mb-4">Sube una carpeta o archivos para generar contenido en la página {pageIndex !== null ? pageIndex + 1 : ''}.</p>
                        <div className="border-2 border-dashed border-main rounded-lg p-8 flex flex-col items-center justify-center bg-tertiary">
                            <UploadIcon className="h-12 w-12 text-subtle mb-2" />
                            <label htmlFor="page-ai-upload" className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                                Subir Carpeta o Archivos
                            </label>
                            <input id="page-ai-upload" type="file" {...{ webkitdirectory: "", directory: "", multiple: true }} ref={inputRef} className="hidden" onChange={handleFolderUpload} />
                        </div>
                    </div>
                );
            case 'config':
                return (
                     <div className="space-y-4 animate-fade-in h-full flex flex-col">
                        <div>
                            <p className="text-sm text-subtle mb-2">Se analizarán {allFiles.length} archivo(s).</p>
                        </div>
                        <div>
                           <label className="text-sm font-medium text-subtle block mb-2">Componentes a Generar</label>
                           <p className="text-xs text-subtle mb-2">Selecciona los tipos de widgets que la IA puede crear.</p>
                           <div className="grid grid-cols-3 gap-2 p-2 bg-tertiary rounded-md border border-main">
                            {AVAILABLE_WIDGETS_FOR_DOCS.map(widgetType => (
                                <div key={widgetType} className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id={`page-ai-widget-${widgetType}`} 
                                        checked={allowedWidgets.includes(widgetType)}
                                        onChange={() => handleWidgetToggle(widgetType)}
                                        className="h-4 w-4 rounded border-main text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                                    />
                                    <label htmlFor={`page-ai-widget-${widgetType}`} className="ml-2 text-xs text-main">{widgetType}</label>
                                </div>
                            ))}
                           </div>
                        </div>
                    </div>
                );
             case 'analyzing':
                return (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-semibold">Generando contenido...</p>
                        <p className="text-sm text-subtle">Usando Gemini Flash para una respuesta rápida.</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                        <p className="text-lg font-semibold text-red-500">Error</p>
                        <p className="text-sm text-subtle my-4">{error}</p>
                        <button onClick={() => setView('upload')} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                            Intentar de Nuevo
                        </button>
                    </div>
                );
        }
    };
    
    const renderFooter = () => {
        if (view === 'config') {
             return (
                <div className="flex justify-between items-center">
                    <button onClick={() => setView('upload')} className="px-4 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                        Atrás
                    </button>
                    <button onClick={handleGenerate} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center">
                        <MagicWandIcon className="h-4 w-4 mr-2"/>
                        <span>Generar Contenido</span>
                    </button>
                </div>
            )
        }
         if (view === 'upload' || view === 'error') {
            return (
                <div className="flex justify-end">
                   <button onClick={resetAndClose} className="px-4 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                       Cerrar
                   </button>
               </div>
           );
        }
        return null; // No footer when analyzing
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetAndClose}>
            <div className="bg-panel rounded-lg shadow-2xl w-full max-w-lg h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-main flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-main flex items-center">
                        <MagicWandIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        Generar Contenido para la Página {pageIndex !== null ? pageIndex + 1 : ''}
                    </h2>
                    <button onClick={resetAndClose} className="p-1 rounded-full hover:bg-tertiary">
                        <CloseIcon className="h-5 w-5 text-subtle" />
                    </button>
                </header>
                <main className="p-6 flex-grow overflow-hidden">
                    {renderContent()}
                </main>
                { (view !== 'analyzing') && (
                    <footer className="p-4 border-t border-main bg-editor-canvas flex-shrink-0">
                        {renderFooter()}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default PageAiGeneratorModal;
