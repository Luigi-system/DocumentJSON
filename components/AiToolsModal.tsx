import React, { useState } from 'react';
import { CloseIcon, MagicWandIcon, DocumentIcon, UploadIcon } from './icons';
import { generateTemplate, extractWidgetsFromText } from '../services/geminiService';
import { AiWidgetGenerationResponse } from '../types';

interface AiToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyExtractedWidgets: (widgets: AiWidgetGenerationResponse) => void;
    onApplyGeneratedTemplate: (widgets: AiWidgetGenerationResponse) => void;
}

const AiToolsModal: React.FC<AiToolsModalProps> = ({ isOpen, onClose, onApplyExtractedWidgets, onApplyGeneratedTemplate }) => {
    const [activeTab, setActiveTab] = useState<'extract' | 'generate'>('extract');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');

    if (!isOpen) return null;

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/plain') {
            setError('Por favor, sube un archivo .txt.');
            return;
        }

        setFileName(file.name);
        setIsLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const widgets = await extractWidgetsFromText(text);
            onApplyExtractedWidgets(widgets);
        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado durante la extracción.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateTemplate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const widgets = await generateTemplate(prompt);
            onApplyGeneratedTemplate(widgets);
        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado durante la generación de la plantilla.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-panel rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-main flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-main flex items-center">
                        <MagicWandIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        Herramientas de IA
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-tertiary">
                        <CloseIcon className="h-5 w-5 text-subtle" />
                    </button>
                </header>

                <div className="border-b border-main px-4">
                    <nav className="flex space-x-4">
                        <button onClick={() => setActiveTab('extract')} className={`py-3 px-1 text-sm font-medium ${activeTab === 'extract' ? 'border-b-2 border-indigo-500 text-main' : 'text-subtle hover:text-main'}`}>Extraer de Documento</button>
                        <button onClick={() => setActiveTab('generate')} className={`py-3 px-1 text-sm font-medium ${activeTab === 'generate' ? 'border-b-2 border-indigo-500 text-main' : 'text-subtle hover:text-main'}`}>Generar Plantilla</button>
                    </nav>
                </div>

                {activeTab === 'extract' && (
                    <div className="p-6">
                        <p className="text-sm text-subtle mb-4">Sube un documento (.txt) y la IA extraerá sus componentes y los colocará en tu hoja.</p>
                        <div className="border-2 border-dashed border-main rounded-lg p-8 flex flex-col items-center justify-center bg-tertiary">
                            <DocumentIcon className="h-12 w-12 text-subtle mb-2" />
                            {isLoading ? (
                                <div className="flex items-center space-x-2 text-sm text-subtle">
                                     <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                     <span>Analizando documento...</span>
                                </div>
                            ) : (
                                <>
                                    <label htmlFor="file-upload" className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                                        <UploadIcon className="h-4 w-4 mr-2 inline" />
                                        Elegir un archivo
                                    </label>
                                    <input id="file-upload" type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
                                    {fileName && <p className="text-xs text-subtle mt-2">{fileName}</p>}
                                </>
                            )}
                        </div>
                         {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
                    </div>
                )}

                {activeTab === 'generate' && (
                    <div className="p-6">
                        <p className="text-sm text-subtle mb-4">Describe la plantilla que quieres crear. La IA generará una nueva página con un diseño completo. Por ejemplo: "Una factura moderna para una empresa de tecnología".</p>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Escribe tu descripción aquí..."
                            className="w-full h-24 p-2 text-sm border border-main rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-tertiary text-main resize-none"
                        />
                         {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleGenerateTemplate}
                                disabled={isLoading || !prompt.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                            >
                               {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        <span>Generando...</span>
                                    </>
                               ) : (
                                    <>
                                        <MagicWandIcon className="h-4 w-4 mr-2"/>
                                        <span>Generar</span>
                                    </>
                               )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiToolsModal;