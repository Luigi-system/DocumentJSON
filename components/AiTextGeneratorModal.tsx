import React, { useState, useMemo } from 'react';
import { CloseIcon, MagicWandIcon, UploadIcon, DocumentIcon, ImageIcon } from './icons';
import { ProjectDocumentation } from '../types';
import { DocumentationTreeView } from './DocumentationTreeView';
import { generateTextFromContext } from '../services/geminiService';

interface AiTextGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (text: string) => void;
    projectDocumentation: ProjectDocumentation | null;
}

type ContextType = 'file' | 'image' | 'project';
type ContextData = {
    type: 'file';
    content: string;
    name: string;
} | {
    type: 'image';
    base64: string;
    mimeType: string;
    name: string;
} | {
    type: 'project';
    selectedPath: string;
} | null;

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove the data URL prefix
            resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const AiTextGeneratorModal: React.FC<AiTextGeneratorModalProps> = ({ isOpen, onClose, onApply, projectDocumentation }) => {
    const [activeTab, setActiveTab] = useState<ContextType>('file');
    const [contextData, setContextData] = useState<ContextData>(null);
    const [prompt, setPrompt] = useState('');
    const [generatedText, setGeneratedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (activeTab === 'file' && file.type.startsWith('text/')) {
            const content = await file.text();
            setContextData({ type: 'file', content, name: file.name });
            setGeneratedText('');
        } else if (activeTab === 'image' && file.type.startsWith('image/')) {
            const base64 = await blobToBase64(file);
            setContextData({ type: 'image', base64, mimeType: file.type, name: file.name });
            setGeneratedText('');
        } else {
            alert('Tipo de archivo no soportado para esta pestaña.');
        }
    };
    
    const handleProjectFileSelect = (path: string) => {
        setContextData({ type: 'project', selectedPath: path });
        setGeneratedText('');
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !contextData) {
            setError('Por favor, proporciona un contexto y una instrucción.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedText('');

        try {
            let contextForApi: any;
            if (contextData.type === 'file') {
                contextForApi = { type: 'file', data: { content: contextData.content }};
            } else if (contextData.type === 'image') {
                contextForApi = { type: 'image', data: { base64: contextData.base64, mimeType: contextData.mimeType }};
            } else if (contextData.type === 'project' && projectDocumentation) {
                const manifest = projectDocumentation.widgets
                    .filter(w => w.type === 'Subtitle' && typeof w.props?.content === 'string')
                    .map(w => `- ${w.props?.content}`)
                    .join('\n');

                const fileWidget = projectDocumentation.widgets.find(w => w.type === 'Text' && w.props?.content?.includes(contextData.selectedPath));
                let fileContent = 'Contenido no encontrado.';
                // This is a heuristic, better would be to find the subtitle then the next text widget
                 const subtitleIndex = projectDocumentation.widgets.findIndex(w => w.type === 'Subtitle' && w.props?.content === contextData.selectedPath);
                 if (subtitleIndex > -1 && projectDocumentation.widgets[subtitleIndex + 1]?.type === 'Text') {
                    fileContent = (projectDocumentation.widgets[subtitleIndex + 1].props?.content as string).replace(/```/g, '');
                 }

                contextForApi = { type: 'projectFile', data: { manifest, selectedPath: contextData.selectedPath, selectedFileContent: fileContent }};
            }
            
            const result = await generateTextFromContext(prompt, contextForApi);
            setGeneratedText(result);

        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderContextContent = () => {
        if (!contextData) return <p className="text-xs text-subtle">No se ha seleccionado ningún contexto.</p>;
        switch(contextData.type) {
            case 'file': return <p className="text-sm flex items-center"><DocumentIcon className="h-4 w-4 mr-2" /> {contextData.name}</p>;
            case 'image': return <p className="text-sm flex items-center"><ImageIcon className="h-4 w-4 mr-2" /> {contextData.name}</p>;
            case 'project': return <p className="text-sm font-mono">{contextData.selectedPath}</p>;
        }
    }

    const tabButtonClass = (tabName: ContextType) => `py-2 px-4 text-sm font-medium ${activeTab === tabName ? 'border-b-2 border-indigo-500 text-main' : 'text-subtle hover:text-main'}`;
    const canGenerate = prompt.trim() && contextData;
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-panel rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-main flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-main flex items-center">
                        <MagicWandIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        Generador de Texto con IA
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-tertiary">
                        <CloseIcon className="h-5 w-5 text-subtle" />
                    </button>
                </header>

                <main className="flex-grow flex overflow-hidden">
                    <div className="w-1/2 p-4 border-r border-main flex flex-col">
                         <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mb-2">1. Proporcionar Contexto</h3>
                         <div className="border-b border-main">
                             <nav className="flex space-x-2">
                                <button onClick={() => { setActiveTab('file'); setContextData(null); }} className={tabButtonClass('file')}>Desde Archivo</button>
                                <button onClick={() => { setActiveTab('image'); setContextData(null); }} className={tabButtonClass('image')}>Desde Imagen</button>
                                {projectDocumentation && <button onClick={() => { setActiveTab('project'); setContextData(null); }} className={tabButtonClass('project')}>Desde Proyecto</button>}
                             </nav>
                         </div>
                         <div className="flex-grow overflow-y-auto mt-2 p-1">
                            {activeTab === 'project' && projectDocumentation && (
                                <DocumentationTreeView documentation={projectDocumentation} onSelectPath={handleProjectFileSelect} selectedPath={contextData?.type === 'project' ? contextData.selectedPath : undefined} />
                            )}
                            {(activeTab === 'file' || activeTab === 'image') && (
                                <div className="border-2 border-dashed border-main rounded-lg p-6 flex flex-col items-center justify-center bg-tertiary h-full">
                                    <UploadIcon className="h-10 w-10 text-subtle mb-2"/>
                                    <label htmlFor="context-upload" className="cursor-pointer bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700">
                                        Elegir {activeTab === 'file' ? 'archivo de texto' : 'imagen'}
                                    </label>
                                    <input id="context-upload" type="file" className="hidden" accept={activeTab === 'file' ? 'text/*' : 'image/*'} onChange={handleFileChange} />
                                    <div className="mt-4 p-2 bg-panel rounded w-full">{renderContextContent()}</div>
                                </div>
                            )}
                         </div>
                    </div>
                    <div className="w-1/2 p-4 flex flex-col">
                        <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mb-2">2. Escribir Instrucción</h3>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Ej: Resume este archivo en tres puntos clave..."
                            className="w-full h-24 p-2 text-sm border border-main rounded-md bg-tertiary text-main resize-none mb-2"
                        />
                        <button onClick={handleGenerate} disabled={!canGenerate || isLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading ? 'Generando...' : 'Generar Texto'}
                        </button>
                        
                         <h3 className="text-sm font-bold text-subtle uppercase tracking-wider mt-4 mb-2">3. Resultado</h3>
                         <div className="flex-grow border border-main bg-tertiary rounded-md p-2 overflow-y-auto">
                            {isLoading && <p className="text-sm text-subtle">Pensando...</p>}
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <p className="text-sm whitespace-pre-wrap">{generatedText}</p>
                         </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-main bg-editor-canvas flex-shrink-0 flex justify-end space-x-2">
                     <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                       Cancelar
                   </button>
                   <button onClick={() => onApply(generatedText)} disabled={!generatedText} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                       Aplicar Texto
                   </button>
                </footer>
            </div>
        </div>
    )
};

export default AiTextGeneratorModal;
