import React, { useState } from 'react';
import { CloseIcon, MagicWandIcon, SendIcon } from './icons';
import { generateJson } from '../services/geminiService';

interface GenerateJsonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJsonGenerated: (jsonString: string) => void;
}

const GenerateJsonModal: React.FC<GenerateJsonModalProps> = ({ isOpen, onClose, onJsonGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useProModel, setUseProModel] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateJson(prompt, useProModel);
            onJsonGenerated(result);
            setPrompt('');
        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-panel rounded-lg shadow-2xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-main flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-main flex items-center">
                        <MagicWandIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        Generar JSON con IA
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-tertiary">
                        <CloseIcon className="h-5 w-5 text-subtle" />
                    </button>
                </header>
                <main className="p-6 flex-grow">
                    <p className="text-sm text-subtle mb-4">
                        Describe la estructura de datos que necesitas. Por ejemplo: "Crea un JSON para un usuario con nombre, email y una lista de 3 amigos."
                    </p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Escribe tu descripción aquí..."
                        className="w-full h-28 p-2 text-sm border border-main rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-tertiary text-main resize-none"
                    />
                     <div className="flex items-center mt-4">
                        <input
                            type="checkbox"
                            id="useProModel"
                            checked={useProModel}
                            onChange={(e) => setUseProModel(e.target.checked)}
                            className="h-4 w-4 rounded border-main text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                        />
                        <label htmlFor="useProModel" className="ml-2 block text-sm text-main">
                            Usar modelo Pro (más lento, mejor calidad)
                        </label>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                </main>
                <footer className="p-4 border-t border-main bg-editor-canvas flex justify-end items-center space-x-3 rounded-b-lg">
                    {isLoading && (
                        <div className="flex items-center space-x-2 text-sm text-subtle">
                             <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                             <span>Generando...</span>
                        </div>
                    )}
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !prompt.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                    >
                       <SendIcon className="h-4 w-4 mr-2"/>
                        <span>Generar</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default GenerateJsonModal;